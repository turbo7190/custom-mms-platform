const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    businessType: {
      type: String,
      enum: ["cannabis", "vape", "cbd", "tobacco", "other"],
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: "US" },
    },
    contactInfo: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      website: { type: String },
    },
    complianceSettings: {
      ageVerificationRequired: { type: Boolean, default: true },
      consentRequired: { type: Boolean, default: true },
      optOutMessage: {
        type: String,
        default: "Reply STOP to opt out of messages. Reply HELP for help.",
      },
      maxMessagesPerDay: { type: Number, default: 5 },
      allowedContentTypes: [
        {
          type: String,
          enum: ["text", "image", "video", "audio", "document"],
        },
      ],
      restrictedKeywords: [String],
      requiredDisclaimers: [String],
    },
    mmsSettings: {
      provider: {
        type: String,
        enum: ["twilio", "bandwidth", "messagebird", "custom"],
        default: "twilio",
      },
      apiCredentials: {
        accountSid: String,
        authToken: String,
        fromNumber: String,
      },
      dailyLimit: { type: Number, default: 1000 },
      monthlyLimit: { type: Number, default: 10000 },
    },
    subscription: {
      plan: {
        type: String,
        enum: ["basic", "professional", "enterprise"],
        default: "basic",
      },
      status: {
        type: String,
        enum: ["active", "suspended", "cancelled", "trial"],
        default: "trial",
      },
      startDate: { type: Date, default: Date.now },
      endDate: Date,
      messagesUsed: { type: Number, default: 0 },
      messagesLimit: { type: Number, default: 1000 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    complianceStatus: {
      type: String,
      enum: ["compliant", "warning", "violation", "suspended"],
      default: "compliant",
    },
    lastComplianceCheck: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
clientSchema.index({ businessName: 1 });
clientSchema.index({ licenseNumber: 1 });
clientSchema.index({ "contactInfo.email": 1 });
clientSchema.index({ businessType: 1 });
clientSchema.index({ "subscription.status": 1 });

// Virtual for full address
clientSchema.virtual("fullAddress").get(function () {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

// Method to check if client can send messages
clientSchema.methods.canSendMessage = function () {
  const now = new Date();
  const isActive = this.isActive && this.subscription.status === "active";
  const withinLimits =
    this.subscription.messagesUsed < this.subscription.messagesLimit;
  const compliant = this.complianceStatus === "compliant";

  return isActive && withinLimits && compliant;
};

// Method to increment message count
clientSchema.methods.incrementMessageCount = function () {
  this.subscription.messagesUsed += 1;
  return this.save();
};

module.exports = mongoose.model("Client", clientSchema);
