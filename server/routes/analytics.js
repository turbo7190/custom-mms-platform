const express = require("express");
const Message = require("../models/Message");
const Template = require("../models/Template");
const Client = require("../models/Client");
const { auth, clientAuth } = require("../middleware/auth");

const router = express.Router();

// Get dashboard analytics
router.get("/dashboard", auth, clientAuth, async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Get message statistics
    const messageStats = await Message.aggregate([
      {
        $match: {
          clientId: clientId,
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
        },
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          sentMessages: {
            $sum: { $cond: [{ $eq: ["$delivery.status", "sent"] }, 1, 0] },
          },
          deliveredMessages: {
            $sum: { $cond: [{ $eq: ["$delivery.status", "delivered"] }, 1, 0] },
          },
          failedMessages: {
            $sum: {
              $cond: [
                { $in: ["$delivery.status", ["failed", "undelivered"]] },
                1,
                0,
              ],
            },
          },
          pendingMessages: {
            $sum: { $cond: [{ $eq: ["$delivery.status", "pending"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get daily message counts for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await Message.aggregate([
      {
        $match: {
          clientId: clientId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ["$delivery.status", "delivered"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Get template usage statistics
    const templateStats = await Template.aggregate([
      { $match: { clientId: clientId } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalSent: { $sum: "$usage.totalSent" },
        },
      },
      { $sort: { totalSent: -1 } },
    ]);

    // Get compliance statistics
    const complianceStats = await Message.aggregate([
      {
        $match: {
          clientId: clientId,
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
        },
      },
      {
        $group: {
          _id: null,
          ageVerified: {
            $sum: { $cond: ["$compliance.ageVerificationPassed", 1, 0] },
          },
          consentVerified: {
            $sum: { $cond: ["$compliance.consentVerified", 1, 0] },
          },
          contentScreened: {
            $sum: { $cond: ["$compliance.contentScreened", 1, 0] },
          },
        },
      },
    ]);

    // Get top performing templates
    const topTemplates = await Template.find({ clientId: clientId })
      .sort({ "usage.totalSent": -1 })
      .limit(5)
      .select("name category usage.totalSent usage.successRate");

    const analytics = {
      messages: messageStats[0] || {
        totalMessages: 0,
        sentMessages: 0,
        deliveredMessages: 0,
        failedMessages: 0,
        pendingMessages: 0,
      },
      dailyStats,
      templateStats,
      compliance: complianceStats[0] || {
        ageVerified: 0,
        consentVerified: 0,
        contentScreened: 0,
      },
      topTemplates,
      deliveryRate: messageStats[0]
        ? (
            (messageStats[0].deliveredMessages /
              messageStats[0].totalMessages) *
            100
          ).toFixed(2)
        : 0,
    };

    res.json(analytics);
  } catch (error) {
    console.error("Get dashboard analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get message analytics
router.get("/messages", auth, clientAuth, async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { startDate, endDate, groupBy = "day" } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let groupFormat;
    switch (groupBy) {
      case "hour":
        groupFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
          hour: { $hour: "$createdAt" },
        };
        break;
      case "day":
        groupFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        break;
      case "week":
        groupFormat = {
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" },
        };
        break;
      case "month":
        groupFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
        break;
      default:
        groupFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
    }

    const messageAnalytics = await Message.aggregate([
      {
        $match: {
          clientId: clientId,
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
        },
      },
      {
        $group: {
          _id: groupFormat,
          total: { $sum: 1 },
          sent: {
            $sum: { $cond: [{ $eq: ["$delivery.status", "sent"] }, 1, 0] },
          },
          delivered: {
            $sum: { $cond: [{ $eq: ["$delivery.status", "delivered"] }, 1, 0] },
          },
          failed: {
            $sum: {
              $cond: [
                { $in: ["$delivery.status", ["failed", "undelivered"]] },
                1,
                0,
              ],
            },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$delivery.status", "pending"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
    ]);

    res.json(messageAnalytics);
  } catch (error) {
    console.error("Get message analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get template analytics
router.get("/templates", auth, clientAuth, async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const templateAnalytics = await Template.aggregate([
      { $match: { clientId: clientId } },
      {
        $lookup: {
          from: "messages",
          let: { templateId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$content.templateId", "$$templateId"] },
                ...(Object.keys(dateFilter).length
                  ? { createdAt: dateFilter }
                  : {}),
              },
            },
          ],
          as: "messages",
        },
      },
      {
        $project: {
          name: 1,
          category: 1,
          totalSent: { $size: "$messages" },
          delivered: {
            $size: {
              $filter: {
                input: "$messages",
                cond: { $eq: ["$$this.delivery.status", "delivered"] },
              },
            },
          },
          failed: {
            $size: {
              $filter: {
                input: "$messages",
                cond: {
                  $in: ["$$this.delivery.status", ["failed", "undelivered"]],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          successRate: {
            $cond: [
              { $gt: ["$totalSent", 0] },
              { $multiply: [{ $divide: ["$delivered", "$totalSent"] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { totalSent: -1 } },
    ]);

    res.json(templateAnalytics);
  } catch (error) {
    console.error("Get template analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get compliance analytics
router.get("/compliance", auth, clientAuth, async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const complianceAnalytics = await Message.aggregate([
      {
        $match: {
          clientId: clientId,
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
        },
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          ageVerified: {
            $sum: { $cond: ["$compliance.ageVerificationPassed", 1, 0] },
          },
          consentVerified: {
            $sum: { $cond: ["$compliance.consentVerified", 1, 0] },
          },
          contentScreened: {
            $sum: { $cond: ["$compliance.contentScreened", 1, 0] },
          },
          disclaimersIncluded: {
            $sum: { $cond: ["$compliance.disclaimersIncluded", 1, 0] },
          },
        },
      },
    ]);

    const result = complianceAnalytics[0] || {
      totalMessages: 0,
      ageVerified: 0,
      consentVerified: 0,
      contentScreened: 0,
      disclaimersIncluded: 0,
    };

    // Calculate compliance rates
    const complianceRates = {
      ageVerificationRate:
        result.totalMessages > 0
          ? ((result.ageVerified / result.totalMessages) * 100).toFixed(2)
          : 0,
      consentVerificationRate:
        result.totalMessages > 0
          ? ((result.consentVerified / result.totalMessages) * 100).toFixed(2)
          : 0,
      contentScreeningRate:
        result.totalMessages > 0
          ? ((result.contentScreened / result.totalMessages) * 100).toFixed(2)
          : 0,
      disclaimerInclusionRate:
        result.totalMessages > 0
          ? ((result.disclaimersIncluded / result.totalMessages) * 100).toFixed(
              2
            )
          : 0,
    };

    res.json({
      ...result,
      rates: complianceRates,
    });
  } catch (error) {
    console.error("Get compliance analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get cost analytics
router.get("/costs", auth, clientAuth, async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const costAnalytics = await Message.aggregate([
      {
        $match: {
          clientId: clientId,
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
        },
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: "$cost.amount" },
          messageCount: { $sum: 1 },
          averageCostPerMessage: { $avg: "$cost.amount" },
        },
      },
    ]);

    const result = costAnalytics[0] || {
      totalCost: 0,
      messageCount: 0,
      averageCostPerMessage: 0,
    };

    res.json(result);
  } catch (error) {
    console.error("Get cost analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Export analytics data
router.get("/export", auth, clientAuth, async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { startDate, endDate, format = "csv" } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const messages = await Message.find({
      clientId: clientId,
      ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
    })
      .select(
        "recipient.phoneNumber content.text delivery.status createdAt cost.amount"
      )
      .sort({ createdAt: -1 });

    if (format === "csv") {
      // Convert to CSV format
      const csvData = messages.map((msg) => ({
        phoneNumber: msg.recipient.phoneNumber,
        text: msg.content.text,
        status: msg.delivery.status,
        createdAt: msg.createdAt,
        cost: msg.cost.amount,
      }));

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="messages.csv"'
      );

      // Simple CSV conversion
      const csv =
        "Phone Number,Text,Status,Created At,Cost\n" +
        csvData
          .map(
            (row) =>
              `"${row.phoneNumber}","${row.text}","${row.status}","${row.createdAt}","${row.cost}"`
          )
          .join("\n");

      res.send(csv);
    } else {
      res.json(messages);
    }
  } catch (error) {
    console.error("Export analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
