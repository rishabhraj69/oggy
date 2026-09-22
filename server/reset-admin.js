require("dotenv").config();

const bcrypt = require("bcryptjs");
const { pool } = require("./config/db");

async function resetAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD missing in .env");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `UPDATE users
       SET email = $1,
           password_hash = $2,
           role = 'admin'
       WHERE role = 'admin'
       RETURNING id, name, email, role`,
      [email, passwordHash]
    );

    if (result.rowCount === 0) {
      console.log("No existing admin found.");
    } else {
      console.log("Admin account updated successfully:");
      console.log(result.rows[0]);
    }
  } catch (error) {
    console.error("Admin reset failed:", error.message);
  } finally {
    await pool.end();
  }
}

resetAdmin();