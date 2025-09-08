const express = require("express");
const { body, validationResult } = require("express-validator");
const Message = require("../models/Message");
const Client = require("../models/Client");
const Template = require("../models/Template");
const { auth, clientAuth } = require("../middleware/auth");
const mmsService = require("../services/mmsService");
const complianceService = require("../services/complianceService");

const router = express.Router();

// Send MMS message
router.post(
  "/send",
  auth,
  clientAuth,
  [
    body("recipient.phoneNumber").isMobilePhone(),
    body("content.text").optional().isLength({ max: 1600 }),
    body("content.templateId").optional().isMongoId(),
    body("scheduling.scheduledFor").optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { recipient, content, scheduling, campaign } = req.body;
      const clientId = req.user.clientId;

      // Get client info
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Check if client can send messages
      if (!client.canSendMessage()) {
        return res.status(403).json({
          message:
            "Client cannot send messages. Check subscription status and compliance.",
        });
      }

      // Check if recipient has opted out
      const existingMessage = await Message.findOne({
        "recipient.phoneNumber": recipient.phoneNumber,
        "recipient.optOutStatus": true,
      });

      if (existingMessage) {
        return res
          .status(400)
          .json({ message: "Recipient has opted out of messages" });
      }

      let messageContent = content;

      // If using template, render it
      if (content.templateId) {
        const template = await Template.findById(content.templateId);
        if (!template || template.clientId.toString() !== clientId.toString()) {
          return res.status(404).json({ message: "Template not found" });
        }

        const templateValidation = template.validateVariables(
          content.variables || {}
        );
        if (!templateValidation.isValid) {
          return res.status(400).json({
            message: "Template validation failed",
            errors: templateValidation.errors,
          });
        }

        const renderedTemplate = template.render(content.variables || {});
        messageContent = {
          text: renderedTemplate.text,
          media: renderedTemplate.media,
          templateId: content.templateId,
        };

        // Increment template usage
        await template.incrementUsage();
      }

      // Compliance checks
      const complianceResult = await complianceService.checkMessageCompliance({
        client,
        recipient,
        content: messageContent,
      });

      if (!complianceResult.passed) {
        return res.status(400).json({
          message: "Message failed compliance check",
          details: complianceResult.details,
        });
      }

      // Create message record
      const message = new Message({
        clientId,
        userId: req.user.userId,
        recipient: {
          ...recipient,
          ageVerified: complianceResult.ageVerified,
          consentGiven: complianceResult.consentVerified,
        },
        content: messageContent,
        compliance: {
          ageVerificationPassed: complianceResult.ageVerified,
          consentVerified: complianceResult.consentVerified,
          contentScreened: complianceResult.contentScreened,
          disclaimersIncluded: complianceResult.disclaimersIncluded,
          screeningResults: complianceResult.screeningResults,
        },
        scheduling: scheduling || { isScheduled: false },
        campaign: campaign || {},
      });

      await message.save();

      // Send message if not scheduled
      if (!scheduling?.isScheduled) {
        try {
          const sendResult = await mmsService.sendMessage(message, client);

          // Update message with delivery info
          await message.updateDeliveryStatus("sent", {
            providerMessageId: sendResult.messageId,
            providerResponse: sendResult.response,
          });

          // Increment client message count
          await client.incrementMessageCount();

          // Emit real-time update
          const io = req.app.get("io");
          io.to(`client-${clientId}`).emit("message-sent", {
            messageId: message._id,
            status: "sent",
            recipient: message.recipient.phoneNumber,
          });

          res.json({
            message: "Message sent successfully",
            messageId: message._id,
            status: "sent",
            providerMessageId: sendResult.messageId,
          });
        } catch (sendError) {
          console.error("Send error:", sendError);

          await message.updateDeliveryStatus("failed", {
            failureReason: sendError.message,
          });

          res.status(500).json({
            message: "Failed to send message",
            error: sendError.message,
          });
        }
      } else {
        res.json({
          message: "Message scheduled successfully",
          messageId: message._id,
          status: "scheduled",
          scheduledFor: scheduling.scheduledFor,
        });
      }
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get messages for client
router.get("/", auth, clientAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      campaignId,
      startDate,
      endDate,
    } = req.query;
    const clientId = req.user.clientId;

    const filter = { clientId };

    if (status) filter["delivery.status"] = status;
    if (campaignId) filter["campaign.campaignId"] = campaignId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "firstName lastName email")
      .populate("content.templateId", "name category");

    const total = await Message.countDocuments(filter);

    res.json({
      messages,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get message by ID
router.get("/:messageId", auth, clientAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const clientId = req.user.clientId;

    const message = await Message.findOne({
      _id: messageId,
      clientId,
    })
      .populate("userId", "firstName lastName email")
      .populate("content.templateId", "name category");

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json(message);
  } catch (error) {
    console.error("Get message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Retry failed message
router.post("/:messageId/retry", auth, clientAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const clientId = req.user.clientId;

    const message = await Message.findOne({
      _id: messageId,
      clientId,
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!message.canRetry()) {
      return res.status(400).json({
        message:
          "Message cannot be retried. Max retries exceeded or not in failed status.",
      });
    }

    const client = await Client.findById(clientId);
    if (!client.canSendMessage()) {
      return res.status(403).json({
        message: "Client cannot send messages",
      });
    }

    // Increment retry count
    await message.incrementRetry();

    try {
      const sendResult = await mmsService.sendMessage(message, client);

      await message.updateDeliveryStatus("sent", {
        providerMessageId: sendResult.messageId,
        providerResponse: sendResult.response,
      });

      await client.incrementMessageCount();

      res.json({
        message: "Message retry successful",
        status: "sent",
        providerMessageId: sendResult.messageId,
      });
    } catch (sendError) {
      await message.updateDeliveryStatus("failed", {
        failureReason: sendError.message,
      });

      res.status(500).json({
        message: "Retry failed",
        error: sendError.message,
      });
    }
  } catch (error) {
    console.error("Retry message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel scheduled message
router.delete("/:messageId", auth, clientAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const clientId = req.user.clientId;

    const message = await Message.findOne({
      _id: messageId,
      clientId,
      "scheduling.isScheduled": true,
      "delivery.status": "pending",
    });

    if (!message) {
      return res.status(404).json({ message: "Scheduled message not found" });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ message: "Scheduled message cancelled successfully" });
  } catch (error) {
    console.error("Cancel message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Webhook for delivery status updates
router.post("/webhook", async (req, res) => {
  try {
    const { messageId, status, error } = req.body;

    if (!messageId) {
      return res.status(400).json({ message: "Message ID required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await message.updateDeliveryStatus(status, {
      failureReason: error,
    });

    // Emit real-time update
    const io = req.app.get("io");
    io.to(`client-${message.clientId}`).emit("message-status-update", {
      messageId: message._id,
      status: status,
      recipient: message.recipient.phoneNumber,
    });

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
