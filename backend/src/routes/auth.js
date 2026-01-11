/**
 * Authentication routes
 */
const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");
const logger = require("../config/logger");

const router = express.Router();

/**
 * Create application error
 */
const createError = (message, statusCode = 500, code = "APPLICATION_ERROR") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string}
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
};

/**
 * POST /api/auth/signup
 * User registration (only for admin/editor roles via invitation)
 */
router.post(
  "/signup",
  [
    body("firstName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name is required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw createError(
          "User with this email already exists",
          400,
          "USER_EXISTS"
        );
      }

      // Create new user (default role is viewer)
      const user = new User({
        firstName,
        lastName,
        email,
        passwordHash: password, // Will be hashed by pre-save middleware
        role: "viewer", // Default role
        isActive: true,
        emailVerified: false,
      });

      await user.save();

      logger.info("New user registered", {
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        message: "Account created successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put(
  "/profile",
  authenticate,
  [
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name cannot be empty"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("phone")
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage("Invalid phone number format"),
    body("bio")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),
  ],
  async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, phone, bio, avatar } = req.body;
      const user = req.user;

      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw createError("Email is already taken", 400, "EMAIL_TAKEN");
        }
      }

      // Update user fields
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (email !== undefined) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (bio !== undefined) user.bio = bio;
      if (avatar !== undefined) user.avatar = avatar;

      await user.save();

      logger.info("User profile updated", {
        userId: user._id,
        email: user.email,
      });

      res.json({
        message: "Profile updated successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phone: user.phone,
          bio: user.bio,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * User login
 */
router.post("/login", async (req, res, next) => {
  try {
    console.log("=== LOGIN REQUEST DEBUG ===");
    console.log("Raw request body:", JSON.stringify(req.body));
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Body type:", typeof req.body);

    const { email, password } = req.body;

    console.log("Extracted email:", JSON.stringify(email));
    console.log("Extracted password:", password ? "[HIDDEN]" : "undefined");
    console.log("Email type:", typeof email);
    console.log("Password type:", typeof password);

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
    console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length);

    // Use fallback JWT_SECRET if not loaded from env
    const jwtSecret =
      process.env.JWT_SECRET || "temporary-jwt-secret-for-testing";
    console.log("Using JWT_SECRET:", jwtSecret.substring(0, 10) + "...");

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "15m" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /api/auth/logout
 * User logout (client-side token removal)
 */
router.post("/logout", authenticate, async (req, res, next) => {
  try {
    logger.info("User logged out", {
      userId: req.user._id,
      email: req.user.email,
      correlationId: req.correlationId,
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get("/me", authenticate, async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        fullName: req.user.fullName,
        phone: req.user.phone,
        bio: req.user.bio,
        avatar: req.user.avatar,
        role: req.user.role,
        lastLoginAt: req.user.lastLoginAt,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
