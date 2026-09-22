require("dotenv").config();

const express = require("express");
const cors = require("cors");

const helmet = require("helmet");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);

const { pool, initializeDatabase } = require("./config/db");
const adminGaragesRouter = require("./routes/adminGarages");

const authRoutes = require("./routes/auth");
const registrationRoutes = require("./routes/registration");

const app = express();

const PORT = process.env.PORT || 5000;

// ========================================
// ENVIRONMENT CHECK
// ========================================

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing in .env");
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.error("❌ SESSION_SECRET is missing in .env");
  process.exit(1);
}

// ========================================
// SECURITY MIDDLEWARE
// ========================================

app.use(helmet());

// ========================================
// CORS CONFIGURATION
// ========================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ========================================
// JSON BODY PARSER
// ========================================

app.use(express.json({ limit: "10kb" }));

// ========================================
// SESSION CONFIGURATION
// ========================================

app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),

    name: "doctor_motors_sid",

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Doctor Motors API is running!",
  });
});

// ========================================
// AUTHENTICATION ROUTES
// ========================================

app.use("/api/auth", authRoutes);

// ========================================
// CUSTOMER + GARAGE REGISTRATION ROUTES
// ========================================

app.use("/api/registration", registrationRoutes);
app.use("/api/admin/garages", adminGaragesRouter);
// Endpoints:
// POST /api/registration/customer
// POST /api/registration/garage

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ========================================
// START SERVER
// ========================================

async function startServer() {
  try {
    await initializeDatabase();

    console.log("✅ Database connected and initialized");

    app.listen(PORT, () => {
      console.log(`🚀 Doctor Motors API running on port ${PORT}`);

      console.log(
        `🌐 Health: http://localhost:${PORT}/api/health`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);

    process.exit(1);
  }
}

startServer();