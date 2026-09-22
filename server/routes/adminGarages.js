const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

const router = express.Router();

// ========================================
// ADMIN AUTHORIZATION
// ========================================

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Please login first",
    });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
}

// ========================================
// CREATE GARAGE OWNER + GARAGE
// POST /api/admin/garages
// ========================================

router.post("/", requireAdmin, async (req, res) => {
  const {
    ownerName,
    ownerEmail,
    ownerPhone,
    password,

    garageName,
    description,
    garageEmail,
    garagePhone,

    address,
    city,
    state,
    pincode,
    logoUrl,
  } = req.body;

  // ------------------------------------
  // REQUIRED FIELD VALIDATION
  // ------------------------------------

  if (
    !ownerName ||
    !ownerEmail ||
    !ownerPhone ||
    !password ||
    !garageName ||
    !garagePhone ||
    !address ||
    !city
  ) {
    return res.status(400).json({
      success: false,
      message: "Please fill all required fields",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  const email = ownerEmail.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid owner email",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ------------------------------------
    // CHECK EXISTING ACCOUNT
    // ------------------------------------

    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "This email is already registered",
      });
    }

    // ------------------------------------
    // HASH PASSWORD
    // ------------------------------------

    const passwordHash = await bcrypt.hash(password, 12);

    // ------------------------------------
    // CREATE GARAGE OWNER ACCOUNT
    // ------------------------------------

    const userResult = await client.query(
      `INSERT INTO users
        (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'garage_owner')
       RETURNING id, name, email, phone, role`,
      [
        ownerName.trim(),
        email,
        ownerPhone.trim(),
        passwordHash,
      ]
    );

    const owner = userResult.rows[0];

    // ------------------------------------
    // CREATE GARAGE
    // ------------------------------------

    const garageResult = await client.query(
      `INSERT INTO garages (
        owner_id,
        name,
        description,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        logo_url,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, 'approved'
      )
      RETURNING *`,
      [
        owner.id,
        garageName.trim(),
        description || null,
        garageEmail || null,
        garagePhone.trim(),
        address.trim(),
        city.trim(),
        state || null,
        pincode || null,
        logoUrl || null,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Garage account created successfully",
      owner,
      garage: garageResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create garage account error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create garage account",
    });
  } finally {
    client.release();
  }
});

module.exports = router;
// Tumhara existing POST route yahan rahega


// ========================================
// GET ALL GARAGES
// Admin only
// GET /api/admin/garages
// ========================================

router.get("/", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        g.*,
        u.name AS owner_name,
        u.email AS owner_email,
        u.phone AS owner_phone
      FROM garages g
      LEFT JOIN users u ON g.owner_id = u.id
      ORDER BY g.created_at DESC
    `);

    return res.json({
      success: true,
      garages: result.rows,
    });
  } catch (error) {
    console.error("Get garages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch garages",
    });
  }
});


// ========================================
// EXPORT ROUTER
// ========================================

module.exports = router;