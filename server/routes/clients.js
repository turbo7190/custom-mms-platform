const express = require("express");
const { body, validationResult } = require("express-validator");
const Client = require("../models/Client");
const User = require("../models/User");
const { auth, adminAuth, clientAuth } = require("../middleware/auth");

const router = express.Router();

// Get all clients (admin only)
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, businessType, status } = req.query;

    const filter = {};
    if (businessType) filter.businessType = businessType;
    if (status) filter["subscription.status"] = status;

    const clients = await Client.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("users", "firstName lastName email role");

    const total = await Client.countDocuments(filter);

    res.json({
      clients,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get clients error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get client by ID
router.get("/:clientId", auth, clientAuth, async (req, res) => {
  try {
    const { clientId } = req.params;

    // Admin can access any client, others only their own
    const query =
      req.user.role === "admin"
        ? { _id: clientId }
        : { _id: clientId, _id: req.user.clientId };

    const client = await Client.findById(query).populate(
      "users",
      "firstName lastName email role"
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    console.error("Get client error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update client settings
router.put(
  "/:clientId",
  auth,
  clientAuth,
  [
    body("businessName").optional().trim().notEmpty(),
    body("contactInfo.phone").optional().isMobilePhone(),
    body("contactInfo.email").optional().isEmail(),
    body("complianceSettings").optional().isObject(),
    body("mmsSettings").optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { clientId } = req.params;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData.licenseNumber;
      delete updateData.subscription;

      const client = await Client.findByIdAndUpdate(clientId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json({
        message: "Client updated successfully",
        client,
      });
    } catch (error) {
      console.error("Update client error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update MMS settings
router.put(
  "/:clientId/mms-settings",
  auth,
  clientAuth,
  [
    body("provider").isIn(["twilio", "bandwidth", "messagebird", "custom"]),
    body("apiCredentials").isObject(),
    body("dailyLimit").optional().isInt({ min: 1 }),
    body("monthlyLimit").optional().isInt({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { clientId } = req.params;
      const { provider, apiCredentials, dailyLimit, monthlyLimit } = req.body;

      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Update MMS settings
      client.mmsSettings = {
        ...client.mmsSettings,
        provider,
        apiCredentials,
        dailyLimit: dailyLimit || client.mmsSettings.dailyLimit,
        monthlyLimit: monthlyLimit || client.mmsSettings.monthlyLimit,
      };

      await client.save();

      res.json({
        message: "MMS settings updated successfully",
        mmsSettings: client.mmsSettings,
      });
    } catch (error) {
      console.error("Update MMS settings error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update compliance settings
router.put(
  "/:clientId/compliance-settings",
  auth,
  clientAuth,
  [
    body("ageVerificationRequired").optional().isBoolean(),
    body("consentRequired").optional().isBoolean(),
    body("maxMessagesPerDay").optional().isInt({ min: 1, max: 100 }),
    body("allowedContentTypes").optional().isArray(),
    body("restrictedKeywords").optional().isArray(),
    body("requiredDisclaimers").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { clientId } = req.params;
      const complianceSettings = req.body;

      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Update compliance settings
      client.complianceSettings = {
        ...client.complianceSettings,
        ...complianceSettings,
      };

      await client.save();

      res.json({
        message: "Compliance settings updated successfully",
        complianceSettings: client.complianceSettings,
      });
    } catch (error) {
      console.error("Update compliance settings error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get client users
router.get("/:clientId/users", auth, clientAuth, async (req, res) => {
  try {
    const { clientId } = req.params;

    const users = await User.find({ clientId }).select("-password");

    res.json(users);
  } catch (error) {
    console.error("Get client users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add user to client
router.post(
  "/:clientId/users",
  auth,
  clientAuth,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    body("role").isIn(["client_admin", "client_user"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { clientId } = req.params;
      const { email, password, firstName, lastName, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role,
        clientId,
      });

      await user.save();

      res.status(201).json({
        message: "User added successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Add user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get client analytics
router.get("/:clientId/analytics", auth, clientAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { startDate, endDate } = req.query;

    // This would typically aggregate data from messages, campaigns, etc.
    // For demo purposes, returning mock data
    const analytics = {
      totalMessages: 0,
      deliveredMessages: 0,
      failedMessages: 0,
      messagesThisMonth: 0,
      messagesThisWeek: 0,
      averageDeliveryTime: 0,
      topTemplates: [],
      deliveryRates: {
        sent: 0,
        delivered: 0,
        failed: 0,
      },
      complianceStats: {
        ageVerified: 0,
        consentVerified: 0,
        contentScreened: 0,
      },
    };

    res.json(analytics);
  } catch (error) {
    console.error("Get client analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
