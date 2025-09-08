const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      phoneNumber: {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            return /^\+?[1-9]\d{1,14}$/.test(v);
          },
          message: "Invalid phone number format",
        },
      },
      name: String,
      email: String,
      ageVerified: { type: Boolean, default: false },
      consentGiven: { type: Boolean, default: false },
      consentDate: Date,
      optOutStatus: { type: Boolean, default: false },
    },
    content: {
      text: String,
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
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Template",
      },
    },
    delivery: {
      status: {
        type: String,
        enum: ["pending", "sent", "delivered", "failed", "undelivered"],
        default: "pending",
      },
      providerMessageId: String,
      providerResponse: mongoose.Schema.Types.Mixed,
      sentAt: Date,
      deliveredAt: Date,
      failureReason: String,
      retryCount: { type: Number, default: 0 },
      maxRetries: { type: Number, default: 3 },
    },
    compliance: {
      ageVerificationPassed: { type: Boolean, default: false },
      consentVerified: { type: Boolean, default: false },
      contentScreened: { type: Boolean, default: false },
      disclaimersIncluded: { type: Boolean, default: false },
      screeningResults: mongoose.Schema.Types.Mixed,
    },
    scheduling: {
      scheduledFor: Date,
      timezone: { type: String, default: "UTC" },
      isScheduled: { type: Boolean, default: false },
      isRecurring: { type: Boolean, default: false },
      recurringPattern: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
      },
    },
    campaign: {
      campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campaign",
      },
      campaignName: String,
    },
    cost: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
      source: { type: String, default: "web" },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
messageSchema.index({ clientId: 1, createdAt: -1 });
messageSchema.index({ "recipient.phoneNumber": 1 });
messageSchema.index({ "delivery.status": 1 });
messageSchema.index({ "scheduling.scheduledFor": 1 });
messageSchema.index({ "campaign.campaignId": 1 });

// Virtual for delivery status
messageSchema.virtual("isDelivered").get(function () {
  return this.delivery.status === "delivered";
});

// Virtual for is failed
messageSchema.virtual("isFailed").get(function () {
  return ["failed", "undelivered"].includes(this.delivery.status);
});

// Method to update delivery status
messageSchema.methods.updateDeliveryStatus = function (
  status,
  additionalData = {}
) {
  this.delivery.status = status;

  if (status === "sent") {
    this.delivery.sentAt = new Date();
  } else if (status === "delivered") {
    this.delivery.deliveredAt = new Date();
  }

  // Update additional data
  Object.assign(this.delivery, additionalData);

  return this.save();
};

// Method to check if message can be retried
messageSchema.methods.canRetry = function () {
  return (
    this.delivery.retryCount < this.delivery.maxRetries &&
    this.delivery.status === "failed"
  );
};

// Method to increment retry count
messageSchema.methods.incrementRetry = function () {
  this.delivery.retryCount += 1;
  return this.save();
};

// Pre-save middleware to validate compliance
messageSchema.pre("save", function (next) {
  // Ensure compliance checks are passed before sending
  if (
    this.delivery.status === "pending" &&
    !this.compliance.ageVerificationPassed
  ) {
    return next(new Error("Age verification required before sending message"));
  }

  if (this.delivery.status === "pending" && !this.compliance.consentVerified) {
    return next(
      new Error("Consent verification required before sending message")
    );
  }

  next();
});

module.exports = mongoose.model("Message", messageSchema);
