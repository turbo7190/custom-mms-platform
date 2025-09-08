const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "promotional",
        "informational",
        "compliance",
        "transactional",
        "marketing",
      ],
      required: true,
    },
    content: {
      text: {
        type: String,
        required: true,
        maxlength: 1600, // MMS character limit
      },
      media: [
        {
          type: {
            type: String,
            enum: ["image", "video", "audio", "document"],
          },
          url: String,
          filename: String,
          size: Number,
          mimeType: String,
        },
      ],
      variables: [
        {
          name: { type: String, required: true },
          description: String,
          required: { type: Boolean, default: false },
          defaultValue: String,
        },
      ],
    },
    compliance: {
      ageVerificationRequired: { type: Boolean, default: true },
      consentRequired: { type: Boolean, default: true },
      disclaimers: [String],
      restrictedKeywords: [String],
      contentScreened: { type: Boolean, default: false },
      screeningResults: mongoose.Schema.Types.Mixed,
    },
    usage: {
      totalSent: { type: Number, default: 0 },
      lastUsed: Date,
      successRate: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes
templateSchema.index({ clientId: 1, isActive: 1 });
templateSchema.index({ category: 1 });
templateSchema.index({ name: 1 });
templateSchema.index({ tags: 1 });

// Method to render template with variables
templateSchema.methods.render = function (variables = {}) {
  let renderedText = this.content.text;

  // Replace variables in text
  this.content.variables.forEach((variable) => {
    const value =
      variables[variable.name] ||
      variable.defaultValue ||
      `{{${variable.name}}}`;
    const regex = new RegExp(`{{${variable.name}}}`, "g");
    renderedText = renderedText.replace(regex, value);
  });

  return {
    text: renderedText,
    media: this.content.media,
    variables: variables,
  };
};

// Method to validate variables
templateSchema.methods.validateVariables = function (variables = {}) {
  const errors = [];

  this.content.variables.forEach((variable) => {
    if (variable.required && !variables[variable.name]) {
      errors.push(`Required variable '${variable.name}' is missing`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

// Method to increment usage
templateSchema.methods.incrementUsage = function () {
  this.usage.totalSent += 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

// Static method to find templates by category
templateSchema.statics.findByCategory = function (clientId, category) {
  return this.find({
    clientId,
    category,
    isActive: true,
    isApproved: true,
  });
};

// Pre-save middleware to validate content
templateSchema.pre("save", function (next) {
  // Check for restricted keywords
  if (this.compliance.restrictedKeywords.length > 0) {
    const text = this.content.text.toLowerCase();
    const hasRestrictedKeyword = this.compliance.restrictedKeywords.some(
      (keyword) => text.includes(keyword.toLowerCase())
    );

    if (hasRestrictedKeyword) {
      return next(new Error("Template contains restricted keywords"));
    }
  }

  next();
});

module.exports = mongoose.model("Template", templateSchema);
