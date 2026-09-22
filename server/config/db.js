const { Pool } = require("pg");

// ========================================
// POSTGRESQL CONNECTION
// ========================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Database connection error handler
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});

// ========================================
// INITIALIZE DATABASE
// ========================================

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ========================================
    // USERS TABLE
    // ========================================

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password_hash TEXT NOT NULL,

        role VARCHAR(20) NOT NULL DEFAULT 'customer'
          CHECK (
            role IN ('customer', 'admin', 'garage_owner')
          ),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Existing databases may still have the old role constraint.
    // Drop it and recreate it with garage_owner included.

    await client.query(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_role_check;
    `);

    await client.query(`
      ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('customer', 'admin', 'garage_owner'));
    `);

    // ========================================
    // GARAGES TABLE
    // ========================================

    await client.query(`
      CREATE TABLE IF NOT EXISTS garages (
        id SERIAL PRIMARY KEY,

        owner_id INTEGER NOT NULL
          REFERENCES users(id) ON DELETE CASCADE,

        name VARCHAR(150) NOT NULL,
        description TEXT,

        email VARCHAR(255),
        phone VARCHAR(20) NOT NULL,

        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        pincode VARCHAR(10),

        logo_url TEXT,

        status VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (
            status IN (
              'pending',
              'approved',
              'rejected',
              'suspended'
            )
          ),

        rejection_reason TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ========================================
    // SERVICES TABLE
    // Each garage manages its own services/prices
    // ========================================

    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,

        garage_id INTEGER NOT NULL
          REFERENCES garages(id) ON DELETE CASCADE,

        name VARCHAR(150) NOT NULL,
        description TEXT,

        category VARCHAR(100),
        vehicle_type VARCHAR(50),

        price NUMERIC(10, 2) NOT NULL
          CHECK (price >= 0),

        discount_price NUMERIC(10, 2)
          CHECK (
            discount_price IS NULL
            OR discount_price >= 0
          ),

        duration_minutes INTEGER
          CHECK (
            duration_minutes IS NULL
            OR duration_minutes > 0
          ),

        is_available BOOLEAN NOT NULL DEFAULT TRUE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ========================================
    // BOOKINGS TABLE
    // Existing booking fields are preserved.
    // ========================================

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,

        booking_id VARCHAR(100) UNIQUE,

        user_id INTEGER
          REFERENCES users(id) ON DELETE SET NULL,

        garage_id INTEGER
          REFERENCES garages(id) ON DELETE SET NULL,

        service_id INTEGER
          REFERENCES services(id) ON DELETE SET NULL,

        customer_name VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL,

        location TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        map_url TEXT,

        vehicle_type VARCHAR(100),
        voltage VARCHAR(50),
        brand VARCHAR(100),
        service VARCHAR(150),

        notes TEXT,

        -- Snapshot of price at booking time
        service_price NUMERIC(10, 2),

        status VARCHAR(30) DEFAULT 'Pending',

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ========================================
    // SAFE MIGRATIONS FOR EXISTING BOOKINGS
    // ========================================

    await client.query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS garage_id INTEGER
      REFERENCES garages(id) ON DELETE SET NULL;
    `);

    await client.query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS service_id INTEGER
      REFERENCES services(id) ON DELETE SET NULL;
    `);

    await client.query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS service_price NUMERIC(10, 2);
    `);

    // ========================================
    // INDEXES
    // ========================================

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email
      ON users(email);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role
      ON users(role);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id
      ON bookings(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_status
      ON bookings(status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_garage_id
      ON bookings(garage_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_garages_owner_id
      ON garages(owner_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_garages_status
      ON garages(status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_services_garage_id
      ON services(garage_id);
    `);

    await client.query("COMMIT");

    console.log("✅ Database tables initialized");
    console.log("✅ Multi-garage structure ready");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Database initialization failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  pool,
  initializeDatabase,
};