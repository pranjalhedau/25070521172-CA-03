// ─────────────────────────────────────────────────────────
// StudyFlow Backend — Entry Point
// ─────────────────────────────────────────────────────────

// 1. Load environment variables FIRST (before anything else uses them)
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import routes and middleware
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const auth = require("./middleware/auth");

// ─── Create Express app ──────────────────────────────────
const app = express();

// ─── Middleware ──────────────────────────────────────────
// Parse JSON request bodies
app.use(express.json());

// Allow requests from the React dev server
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ─── Routes ─────────────────────────────────────────────

// Health check (public — no auth needed)
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "StudyFlow API is running.",
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

// Auth routes (public — register & login)
app.use("/api/auth", authRoutes);

// Task routes (protected — require valid JWT)
app.use("/api/tasks", auth, taskRoutes);

// ─── 404 handler for unknown API routes ─────────────────
app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found." });
});

// ─── Global error handler ───────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error." });
});

// ─── Connect to MongoDB, then start server ──────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/studyflow";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✓ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("✗ MongoDB connection failed:", err.message);
    process.exit(1);
  });
