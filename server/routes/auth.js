const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { pool } = require("../config/db");

const router = express.Router();

const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

// ========================================
// EMAIL TRANSPORTER
// ========================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ========================================
// ADMIN AUTHORIZATION
// ========================================

function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: "Please login first.",
    });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }

  next();
}

// ========================================
// CUSTOMER REGISTER
// POST /api/auth/register
// ========================================

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existing.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, name, email, role`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account.",
    });
  }
});

// ========================================
// LOGIN
// POST /api/auth/login
// ========================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();

    const attempt = loginAttempts.get(normalizedEmail);

    if (attempt && attempt.lockUntil > now) {
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Try again in ${Math.ceil(
          (attempt.lockUntil - now) / 60000
        )} minutes.`,
      });
    }

    if (attempt && attempt.lockUntil <= now) {
      loginAttempts.delete(normalizedEmail);
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      const current = loginAttempts.get(normalizedEmail) || {
        count: 0,
        lockUntil: 0,
      };

      current.count += 1;

      if (current.count >= MAX_ATTEMPTS) {
        current.lockUntil = Date.now() + LOCK_TIME;
      }

      loginAttempts.set(normalizedEmail, current);

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    loginAttempts.delete(normalizedEmail);

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session Error:", err);

        return res.status(500).json({
          success: false,
          message: "Unable to create session.",
        });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session Save Error:", saveError);

          return res.status(500).json({
            success: false,
            message: "Unable to save session.",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Login successful.",
          user: req.session.user,
        });
      });
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
});

// ========================================
// GET LOGGED-IN USER
// GET /api/auth/me
// ========================================

router.get("/me", (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: "Not logged in.",
    });
  }

  return res.json({
    success: true,
    user: req.session.user,
  });
});

// ========================================
// LOGOUT
// POST /api/auth/logout
// ========================================

router.post("/logout", (req, res) => {
  if (!req.session) {
    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  }

  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Unable to logout.",
      });
    }

    res.clearCookie("doctor_motors_sid");

    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  });
});

// ========================================
// CREATE NEW ADMIN
// POST /api/auth/create-admin
// ========================================

router.post("/create-admin", requireAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existing.rows.length) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, name, email, role`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully.",
      admin: result.rows[0],
    });
  } catch (error) {
    console.error("Create Admin Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create Admin account.",
    });
  }
});

// ========================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ========================================

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your registered email.",
      });
    }

    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      return res.status(503).json({
        success: false,
        message: "Email service is not configured yet.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    const genericMessage =
      "If this email is registered, a password reset OTP will be sent.";

    // Generic response for unknown email
    if (!result.rows.length) {
      return res.json({
        success: true,
        message: genericMessage,
      });
    }

    const user = result.rows[0];

    // Create reset table if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        otp_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure attempts column exists for older tables
    await pool.query(`
      ALTER TABLE password_resets
      ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0
    `);

    // Invalidate previous OTPs
    await pool.query(
      `UPDATE password_resets
       SET used = TRUE
       WHERE user_id = $1 AND used = FALSE`,
      [user.id]
    );

    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    await pool.query(
      `INSERT INTO password_resets
       (user_id, otp_hash, expires_at, attempts)
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes', 0)`,
      [user.id, otpHash]
    );

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: "Doctor Motors - Password Reset OTP",
      text: `Hello ${user.name},

Your Doctor Motors password reset OTP is: ${otp}

This OTP will expire in 5 minutes.

If you did not request this, please ignore this email.

Doctor Motors`,
    });

    return res.json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request.",
    });
  }
});

// ========================================
// RESET PASSWORD USING OTP
// POST /api/auth/reset-password
// ========================================

router.post("/reset-password", async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, otp, newPassword } = req.body;

    if (!email?.trim() || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and new password are required.",
      });
    }

    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    await client.query("BEGIN");

    const userResult = await client.query(
      `SELECT id
       FROM users
       WHERE email = $1
       FOR UPDATE`,
      [normalizedEmail]
    );

    if (!userResult.rows.length) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    const userId = userResult.rows[0].id;

    const resetResult = await client.query(
      `SELECT id, otp_hash, attempts
       FROM password_resets
       WHERE user_id = $1
         AND used = FALSE
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [userId]
    );

    if (!resetResult.rows.length) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    const reset = resetResult.rows[0];

    if (reset.attempts >= OTP_MAX_ATTEMPTS) {
      await client.query(
        `UPDATE password_resets
         SET used = TRUE
         WHERE id = $1`,
        [reset.id]
      );

      await client.query("COMMIT");

      return res.status(429).json({
        success: false,
        message: "Too many OTP attempts. Request a new OTP.",
      });
    }

    const submittedHash = crypto
      .createHash("sha256")
      .update(String(otp))
      .digest("hex");

    const otpMatch = crypto.timingSafeEqual(
      Buffer.from(reset.otp_hash, "hex"),
      Buffer.from(submittedHash, "hex")
    );

    if (!otpMatch) {
      const nextAttempts = reset.attempts + 1;

      await client.query(
        `UPDATE password_resets
         SET attempts = $1,
             used = CASE WHEN $1 >= $2 THEN TRUE ELSE used END
         WHERE id = $3`,
        [nextAttempts, OTP_MAX_ATTEMPTS, reset.id]
      );

      await client.query("COMMIT");

      return res.status(400).json({
        success: false,
        message:
          nextAttempts >= OTP_MAX_ATTEMPTS
            ? "Too many OTP attempts. Request a new OTP."
            : "Invalid or expired OTP.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await client.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2`,
      [passwordHash, userId]
    );

    // Mark all reset OTPs for this user as used
    await client.query(
      `UPDATE password_resets
       SET used = TRUE
       WHERE user_id = $1 AND used = FALSE`,
      [userId]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password.",
    });
  } finally {
    client.release();
  }
});

module.exports = router;