const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const { pool } = require("../config/db");

const router = express.Router();

// ========================================
// CONFIGURATION
// ========================================

const OTP_EXPIRY = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// In-memory stores.
// For production, move these to PostgreSQL or Redis.
const otpStore = new Map();
const verifiedEmails = new Map();
const otpSendCooldown = new Map();

// ========================================
// HELPERS
// ========================================

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email) {
  return clean(email).toLowerCase();
}

function createOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// ========================================
// SMTP TRANSPORTER
// ========================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ========================================
// CLOUDFLARE TURNSTILE CAPTCHA
// ========================================

async function verifyCaptcha(token) {
  if (!token || !process.env.TURNSTILE_SECRET_KEY) {
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );

    const result = await response.json();

    return result.success === true;
  } catch (error) {
    console.error("CAPTCHA verification error:", error.message);
    return false;
  }
}

// ========================================
// SEND EMAIL OTP
// POST /api/registration/otp/send
// ========================================

router.post("/otp/send", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const captchaToken = clean(req.body.captchaToken);

  if (!validEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  const captchaValid = await verifyCaptcha(captchaToken);

  if (!captchaValid) {
    return res.status(400).json({
      success: false,
      message: "CAPTCHA verification failed. Please try again.",
    });
  }

  const now = Date.now();
  const lastSent = otpSendCooldown.get(email) || 0;

  if (now - lastSent < OTP_RESEND_COOLDOWN) {
    const remaining = Math.ceil(
      (OTP_RESEND_COOLDOWN - (now - lastSent)) / 1000
    );

    return res.status(429).json({
      success: false,
      message: `Please wait ${remaining} seconds before requesting another OTP.`,
    });
  }

  try {
    // Do not send OTP to an already registered email.
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    const otp = createOtp();

    otpStore.set(email, {
      otpHash: hashOtp(otp),
      expiresAt: now + OTP_EXPIRY,
      attempts: 0,
    });

    // Set cooldown before sending to limit repeated requests.
    otpSendCooldown.set(email, now);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Doctor Motors - Email Verification OTP",
      text: `Your Doctor Motors verification OTP is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px">
          <h2>Doctor Motors</h2>
          <p>Your email verification OTP is:</p>
          <h1 style="letter-spacing:6px">${otp}</h1>
          <p>This OTP expires in 5 minutes.</p>
          <p>Do not share this code with anyone.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Please check your email.",
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    otpStore.delete(email);

    return res.status(500).json({
      success: false,
      message: "Unable to send OTP. Please check email configuration.",
    });
  }
});

// ========================================
// VERIFY EMAIL OTP
// POST /api/registration/otp/verify
// ========================================

router.post("/otp/verify", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = clean(req.body.otp);

  if (!validEmail(email) || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid email and 6-digit OTP.",
    });
  }

  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({
      success: false,
      message: "OTP not found. Please request a new OTP.",
    });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);

    return res.status(400).json({
      success: false,
      message: "OTP expired. Please request a new OTP.",
    });
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(email);

    return res.status(429).json({
      success: false,
      message: "Too many incorrect OTP attempts. Request a new OTP.",
    });
  }

  if (hashOtp(otp) !== record.otpHash) {
    record.attempts += 1;

    return res.status(400).json({
      success: false,
      message: `Incorrect OTP. ${
        MAX_OTP_ATTEMPTS - record.attempts
      } attempts remaining.`,
    });
  }

  otpStore.delete(email);
  verifiedEmails.set(email, Date.now() + 15 * 60 * 1000);

  return res.status(200).json({
    success: true,
    message: "Email verified successfully.",
  });
});

// ========================================
// CAPTCHA + VERIFIED EMAIL CHECK
// ========================================

async function validateRegistration(req, res, email) {
  const captchaValid = await verifyCaptcha(
    clean(req.body.captchaToken)
  );

  if (!captchaValid) {
    res.status(400).json({
      success: false,
      message: "Please complete the CAPTCHA verification.",
    });

    return false;
  }

  const verifiedUntil = verifiedEmails.get(email);

  if (!verifiedUntil || Date.now() > verifiedUntil) {
    verifiedEmails.delete(email);

    res.status(400).json({
      success: false,
      message: "Please verify your email with OTP first.",
    });

    return false;
  }

  return true;
}

// ========================================
// CUSTOMER REGISTRATION
// POST /api/registration/customer
// ========================================

router.post("/customer", async (req, res) => {
  const name = clean(req.body.name);
  const email = normalizeEmail(req.body.email);
  const phone = clean(req.body.phone);
  const password = req.body.password;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  if (!validEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters.",
    });
  }

  const allowed = await validateRegistration(req, res, email);

  if (!allowed) return;

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users
        (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, name, email, phone, role`,
      [name, email, phone, passwordHash]
    );

    verifiedEmails.delete(email);

    return res.status(201).json({
      success: true,
      message: "Customer account created successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Customer registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account.",
    });
  }
});

// ========================================
// GARAGE OWNER REGISTRATION
// POST /api/registration/garage
// ========================================

router.post("/garage", async (req, res) => {
  const ownerName = clean(req.body.ownerName);
  const email = normalizeEmail(req.body.email);
  const ownerPhone = clean(req.body.ownerPhone);
  const password = req.body.password;

  const garageName = clean(req.body.garageName);
  const address = clean(req.body.address);
  const city = clean(req.body.city);
  const state = clean(req.body.state);
  const pincode = clean(req.body.pincode);
  const garagePhone = clean(req.body.garagePhone);

  if (
    !ownerName ||
    !email ||
    !ownerPhone ||
    !password ||
    !garageName ||
    !address ||
    !city ||
    !state ||
    !pincode ||
    !garagePhone
  ) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all required fields.",
    });
  }

  if (!validEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters.",
    });
  }

  const allowed = await validateRegistration(req, res, email);

  if (!allowed) return;

  let client;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userResult = await client.query(
      `INSERT INTO users
        (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'garage_owner')
       RETURNING id, name, email, phone, role`,
      [ownerName, email, ownerPhone, passwordHash]
    );

    const owner = userResult.rows[0];

    const garageResult = await client.query(
      `INSERT INTO garages
        (owner_id, name, address, city, state, pincode, phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, name, address, city, state, pincode, phone, status`,
      [
        owner.id,
        garageName,
        address,
        city,
        state,
        pincode,
        garagePhone,
      ]
    );

    await client.query("COMMIT");

    verifiedEmails.delete(email);

    return res.status(201).json({
      success: true,
      message:
        "Garage registered successfully. Waiting for Super Admin approval.",
      user: owner,
      garage: garageResult.rows[0],
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Garage registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register garage. Please try again.",
    });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;