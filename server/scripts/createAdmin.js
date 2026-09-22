require("dotenv").config();

const bcrypt = require("bcrypt");
const { pool, initializeDatabase } = require("../config/db");

async function createAdmin() {
  try {
    // Initialize database tables
    await initializeDatabase();

    const name = "Doctor Motors Admin";
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD missing in .env");
    }

    if (password.length < 12) {
      throw new Error("Admin password must be at least 12 characters");
    }

    // Check if admin already exists
    const existingAdmin = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingAdmin.rows.length > 0) {
      console.log("⚠️ Account with this email already exists.");
      console.log("If it is an admin, you can log in.");
      return;
    }

    // Hash admin password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin account
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')`,
      [name, email, passwordHash]
    );

    console.log("✅ Admin created successfully!");
    console.log("Admin email:", email);
    console.log("Role: admin");
  } catch (error) {
    console.error("❌ Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

createAdmin();