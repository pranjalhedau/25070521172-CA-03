const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: generate a signed JWT for a user
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// ──────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // Hash password and create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    // Return user info + token (password is stripped by toJSON)
    const token = generateToken(user._id);
    res.status(201).json({
      message: "Registration successful.",
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Find user by email (need to explicitly select password since toJSON strips it)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // If user signed up via Google and has no local password
    if (!user.password) {
      return res.status(401).json({
        message: "This account was registered with Google. Please use Google Sign-In.",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Return user info + token
    const token = generateToken(user._id);
    res.json({
      message: "Login successful.",
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/google
// ──────────────────────────────────────────────
router.post("/google", async (req, res) => {
  try {
    const idToken = req.body.credential || req.body.idToken || req.body.token;

    if (!idToken) {
      return res.status(400).json({ message: "Google ID token credential is required." });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("GOOGLE_CLIENT_ID is not configured in server environment.");
      return res.status(500).json({ message: "Google authentication is not configured on server." });
    }

    // Verify Google ID token using OAuth2Client
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
    } catch (verifyErr) {
      console.error("Google ID token verification failed:", verifyErr.message);
      return res.status(401).json({ message: "Invalid or expired Google credential." });
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email || payload.email_verified !== true) {
      return res.status(400).json({
        message: "Google account email is not verified or unavailable.",
      });
    }

    const googleId = payload.sub; // Google's unique, stable identifier
    const email = payload.email.toLowerCase();
    const name = payload.name || payload.given_name || email.split("@")[0];

    // Find existing user by Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user already exists with the same verified email
      user = await User.findOne({ email });

      if (user) {
        // Safely link Google ID to existing verified account
        user.googleId = googleId;
        if (!user.name && name) {
          user.name = name;
        }
        await user.save();
      } else {
        // Create new user with Google account (no password required)
        user = await User.create({
          name,
          email,
          googleId,
        });
      }
    }

    // Issue standard StudyFlow JWT
    const token = generateToken(user._id);
    res.json({
      message: "Google sign-in successful.",
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(500).json({ message: "Server error during Google authentication." });
  }
});

module.exports = router;
