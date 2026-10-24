const jwt = require("jsonwebtoken");

// Middleware: verify JWT from Authorization header and attach user ID to req
function auth(req, res, next) {
  // Expect header: "Authorization: Bearer <token>"
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided. Please log in." });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // attach to request for route handlers
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = auth;
