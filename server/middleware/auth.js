const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    const user = await User.findById(decoded.userId).populate("clientId");
    if (!user) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    req.user = {
      userId: user._id,
      clientId: user.clientId?._id,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required." });
  }
  next();
};

// Middleware to check if user belongs to client
const clientAuth = (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }

  if (!req.user.clientId) {
    return res.status(403).json({ message: "Client access required" });
  }

  // Check if the requested clientId matches user's clientId
  const requestedClientId = req.params.clientId || req.body.clientId;
  if (
    requestedClientId &&
    requestedClientId.toString() !== req.user.clientId.toString()
  ) {
    return res.status(403).json({ message: "Access denied to this client" });
  }

  next();
};

module.exports = { auth, adminAuth, clientAuth };
