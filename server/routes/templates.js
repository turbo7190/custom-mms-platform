const express = require("express");
const { body, validationResult } = require("express-validator");
const Template = require("../models/Template");
const { auth, clientAuth } = require("../middleware/auth");

const router = express.Router();

// Get templates for client
router.get("/", auth, clientAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, isActive } = req.query;
    const clientId = req.user.clientId;

    const filter = { clientId };

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "content.text": { $regex: search, $options: "i" } },
      ];
    }

    const templates = await Template.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Template.countDocuments(filter);

    res.json({
      templates,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get templates error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get template by ID
router.get("/:templateId", auth, clientAuth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const clientId = req.user.clientId;

    const template = await Template.findOne({
      _id: templateId,
      clientId,
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Get template error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new template
router.post(
  "/",
  auth,
  clientAuth,
  [
    body("name").trim().notEmpty(),
    body("description").optional().trim(),
    body("category").isIn([
      "promotional",
      "informational",
      "compliance",
      "transactional",
      "marketing",
    ]),
    body("content.text").isLength({ min: 1, max: 1600 }),
    body("content.variables").optional().isArray(),
    body("tags").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, category, content, tags = [] } = req.body;
      const clientId = req.user.clientId;

      // Check if template name already exists for this client
      const existingTemplate = await Template.findOne({
        name,
        clientId,
      });

      if (existingTemplate) {
        return res
          .status(400)
          .json({ message: "Template name already exists" });
      }

      const template = new Template({
        clientId,
        name,
        description,
        category,
        content,
        tags,
        compliance: {
          ageVerificationRequired: true,
          consentRequired: true,
          disclaimers: [],
          restrictedKeywords: [],
          contentScreened: false,
        },
      });

      await template.save();

      res.status(201).json({
        message: "Template created successfully",
        template,
      });
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update template
router.put(
  "/:templateId",
  auth,
  clientAuth,
  [
    body("name").optional().trim().notEmpty(),
    body("description").optional().trim(),
    body("category")
      .optional()
      .isIn([
        "promotional",
        "informational",
        "compliance",
        "transactional",
        "marketing",
      ]),
    body("content.text").optional().isLength({ min: 1, max: 1600 }),
    body("content.variables").optional().isArray(),
    body("tags").optional().isArray(),
    body("isActive").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { templateId } = req.params;
      const clientId = req.user.clientId;
      const updateData = req.body;

      // Check if template exists and belongs to client
      const template = await Template.findOne({
        _id: templateId,
        clientId,
      });

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Check if new name conflicts with existing template
      if (updateData.name && updateData.name !== template.name) {
        const existingTemplate = await Template.findOne({
          name: updateData.name,
          clientId,
          _id: { $ne: templateId },
        });

        if (existingTemplate) {
          return res
            .status(400)
            .json({ message: "Template name already exists" });
        }
      }

      // Update template
      Object.assign(template, updateData);
      await template.save();

      res.json({
        message: "Template updated successfully",
        template,
      });
    } catch (error) {
      console.error("Update template error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete template
router.delete("/:templateId", auth, clientAuth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const clientId = req.user.clientId;

    const template = await Template.findOneAndDelete({
      _id: templateId,
      clientId,
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Delete template error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Duplicate template
router.post("/:templateId/duplicate", auth, clientAuth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const clientId = req.user.clientId;

    const originalTemplate = await Template.findOne({
      _id: templateId,
      clientId,
    });

    if (!originalTemplate) {
      return res.status(404).json({ message: "Template not found" });
    }

    const duplicatedTemplate = new Template({
      ...originalTemplate.toObject(),
      _id: undefined,
      name: `${originalTemplate.name} (Copy)`,
      usage: {
        totalSent: 0,
        lastUsed: null,
        successRate: 0,
      },
      isApproved: false,
      approvedBy: undefined,
      approvedAt: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await duplicatedTemplate.save();

    res.status(201).json({
      message: "Template duplicated successfully",
      template: duplicatedTemplate,
    });
  } catch (error) {
    console.error("Duplicate template error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Preview template with variables
router.post(
  "/:templateId/preview",
  auth,
  clientAuth,
  [body("variables").isObject()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { templateId } = req.params;
      const { variables } = req.body;
      const clientId = req.user.clientId;

      const template = await Template.findOne({
        _id: templateId,
        clientId,
      });

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Validate variables
      const validation = template.validateVariables(variables);
      if (!validation.isValid) {
        return res.status(400).json({
          message: "Invalid variables",
          errors: validation.errors,
        });
      }

      // Render template
      const rendered = template.render(variables);

      res.json({
        rendered,
        original: {
          text: template.content.text,
          media: template.content.media,
        },
      });
    } catch (error) {
      console.error("Preview template error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get template categories
router.get("/categories/list", auth, clientAuth, (req, res) => {
  const categories = [
    { value: "promotional", label: "Promotional" },
    { value: "informational", label: "Informational" },
    { value: "compliance", label: "Compliance" },
    { value: "transactional", label: "Transactional" },
    { value: "marketing", label: "Marketing" },
  ];

  res.json(categories);
});

// Get template usage statistics
router.get("/:templateId/usage", auth, clientAuth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const clientId = req.user.clientId;

    const template = await Template.findOne({
      _id: templateId,
      clientId,
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // In production, this would aggregate data from messages
    const usageStats = {
      totalSent: template.usage.totalSent,
      lastUsed: template.usage.lastUsed,
      successRate: template.usage.successRate,
      monthlyUsage: [],
      dailyUsage: [],
    };

    res.json(usageStats);
  } catch (error) {
    console.error("Get template usage error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
