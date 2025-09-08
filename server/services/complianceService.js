const axios = require("axios");

class ComplianceService {
  constructor() {
    this.restrictedKeywords = [
      "marijuana",
      "cannabis",
      "weed",
      "pot",
      "smoke",
      "smoking",
      "vape",
      "vaping",
      "e-cigarette",
      "nicotine",
      "tobacco",
      "high",
      "stoned",
      "baked",
      "blazed",
      "dank",
      "kush",
      "thc",
      "cbd",
      "hemp",
      "edibles",
      "concentrates",
      "bong",
      "pipe",
      "joint",
      "blunt",
      "dab",
      "wax",
      "sativa",
      "indica",
      "hybrid",
      "strain",
    ];

    this.requiredDisclaimers = [
      "For adults 21+ only",
      "Consume responsibly",
      "Not for sale to minors",
      "Check local laws",
      "This product is not approved by the FDA",
    ];

    this.ageVerificationMethods = [
      "date_of_birth",
      "age_confirmation",
      "id_verification",
      "self_declaration",
    ];
  }

  async checkMessageCompliance({ client, recipient, content }) {
    const results = {
      passed: true,
      ageVerified: false,
      consentVerified: false,
      contentScreened: false,
      disclaimersIncluded: false,
      details: [],
      screeningResults: {},
    };

    try {
      // 1. Age verification check
      const ageCheck = await this.verifyAge(recipient, client);
      results.ageVerified = ageCheck.verified;
      if (!ageCheck.verified) {
        results.passed = false;
        results.details.push("Age verification required");
      }

      // 2. Consent verification check
      const consentCheck = await this.verifyConsent(recipient, client);
      results.consentVerified = consentCheck.verified;
      if (!consentCheck.verified) {
        results.passed = false;
        results.details.push("Consent verification required");
      }

      // 3. Content screening
      const contentCheck = await this.screenContent(content, client);
      results.contentScreened = contentCheck.screened;
      results.screeningResults = contentCheck.results;

      if (!contentCheck.approved) {
        results.passed = false;
        results.details.push(
          "Content failed screening: " + contentCheck.reason
        );
      }

      // 4. Disclaimer check
      const disclaimerCheck = this.checkDisclaimers(content, client);
      results.disclaimersIncluded = disclaimerCheck.included;
      if (
        !disclaimerCheck.included &&
        client.complianceSettings.requiredDisclaimers.length > 0
      ) {
        results.passed = false;
        results.details.push("Required disclaimers missing");
      }

      // 5. Business hours check (if applicable)
      const businessHoursCheck = this.checkBusinessHours(client);
      if (!businessHoursCheck.allowed) {
        results.passed = false;
        results.details.push("Messages not allowed outside business hours");
      }

      // 6. Rate limiting check
      const rateLimitCheck = await this.checkRateLimit(recipient, client);
      if (!rateLimitCheck.allowed) {
        results.passed = false;
        results.details.push("Rate limit exceeded for recipient");
      }

      return results;
    } catch (error) {
      console.error("Compliance check error:", error);
      return {
        passed: false,
        ageVerified: false,
        consentVerified: false,
        contentScreened: false,
        disclaimersIncluded: false,
        details: ["Compliance check failed: " + error.message],
        screeningResults: {},
      };
    }
  }

  async verifyAge(recipient, client) {
    // Check if age verification is required
    if (!client.complianceSettings.ageVerificationRequired) {
      return { verified: true };
    }

    // Check if age was already verified
    if (recipient.ageVerified) {
      return { verified: true };
    }

    // For demo purposes, we'll simulate age verification
    // In production, integrate with age verification services
    const ageVerified = recipient.ageVerified || false;

    return {
      verified: ageVerified,
      method: "self_declaration",
      timestamp: new Date(),
    };
  }

  async verifyConsent(recipient, client) {
    // Check if consent is required
    if (!client.complianceSettings.consentRequired) {
      return { verified: true };
    }

    // Check if consent was already given
    if (recipient.consentGiven) {
      return { verified: true };
    }

    // For demo purposes, we'll simulate consent verification
    // In production, implement proper consent management
    const consentGiven = recipient.consentGiven || false;

    return {
      verified: consentGiven,
      method: "explicit_consent",
      timestamp: recipient.consentDate || new Date(),
    };
  }

  async screenContent(content, client) {
    const results = {
      screened: true,
      approved: true,
      reason: "",
      flaggedKeywords: [],
      suggestedChanges: [],
    };

    try {
      const text = content.text?.toLowerCase() || "";

      // Check for restricted keywords
      const restrictedKeywords =
        client.complianceSettings.restrictedKeywords || this.restrictedKeywords;
      const foundKeywords = restrictedKeywords.filter((keyword) =>
        text.includes(keyword.toLowerCase())
      );

      if (foundKeywords.length > 0) {
        results.approved = false;
        results.flaggedKeywords = foundKeywords;
        results.reason = `Content contains restricted keywords: ${foundKeywords.join(
          ", "
        )}`;
      }

      // Check for inappropriate content
      const inappropriateCheck = await this.checkInappropriateContent(text);
      if (!inappropriateCheck.approved) {
        results.approved = false;
        results.reason = inappropriateCheck.reason;
      }

      // Check media content if present
      if (content.media && content.media.length > 0) {
        const mediaCheck = await this.checkMediaContent(content.media);
        if (!mediaCheck.approved) {
          results.approved = false;
          results.reason = mediaCheck.reason;
        }
      }

      // Check message length
      if (text.length > 1600) {
        results.approved = false;
        results.reason = "Message exceeds character limit";
      }

      return results;
    } catch (error) {
      console.error("Content screening error:", error);
      return {
        screened: false,
        approved: false,
        reason: "Content screening failed: " + error.message,
        flaggedKeywords: [],
        suggestedChanges: [],
      };
    }
  }

  async checkInappropriateContent(text) {
    // This would integrate with content moderation APIs
    // For demo purposes, we'll do basic checks

    const inappropriatePatterns = [
      /underage|minor|child/gi,
      /illegal|unlawful/gi,
      /addiction|addict/gi,
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(text)) {
        return {
          approved: false,
          reason: "Content contains inappropriate language",
        };
      }
    }

    return { approved: true };
  }

  async checkMediaContent(media) {
    // Check media file types and sizes
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "audio/mp3",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const mediaItem of media) {
      if (!allowedTypes.includes(mediaItem.mimeType)) {
        return {
          approved: false,
          reason: `Unsupported media type: ${mediaItem.mimeType}`,
        };
      }

      if (mediaItem.size > maxSize) {
        return {
          approved: false,
          reason: `Media file too large: ${mediaItem.size} bytes`,
        };
      }
    }

    return { approved: true };
  }

  checkDisclaimers(content, client) {
    const requiredDisclaimers =
      client.complianceSettings.requiredDisclaimers || this.requiredDisclaimers;
    const text = content.text?.toLowerCase() || "";

    const includedDisclaimers = requiredDisclaimers.filter((disclaimer) =>
      text.includes(disclaimer.toLowerCase())
    );

    return {
      included: includedDisclaimers.length > 0,
      found: includedDisclaimers,
      missing: requiredDisclaimers.filter(
        (d) => !includedDisclaimers.includes(d)
      ),
    };
  }

  checkBusinessHours(client) {
    // Check if current time is within business hours
    // This is a simplified check - in production, consider timezone and business hours
    const now = new Date();
    const hour = now.getHours();

    // Default business hours: 9 AM to 9 PM
    const businessStart = 9;
    const businessEnd = 21;

    return {
      allowed: hour >= businessStart && hour < businessEnd,
      currentTime: now,
      businessHours: `${businessStart}:00 - ${businessEnd}:00`,
    };
  }

  async checkRateLimit(recipient, client) {
    // Check if recipient has exceeded rate limits
    const maxMessagesPerDay = client.complianceSettings.maxMessagesPerDay || 5;

    // In production, implement proper rate limiting with Redis or database
    // For demo purposes, we'll assume rate limit is not exceeded
    return {
      allowed: true,
      limit: maxMessagesPerDay,
      used: 0,
      remaining: maxMessagesPerDay,
    };
  }

  // Generate compliance report for client
  async generateComplianceReport(clientId, startDate, endDate) {
    // This would generate a comprehensive compliance report
    // including message counts, violations, and recommendations

    return {
      clientId,
      period: { startDate, endDate },
      totalMessages: 0,
      compliantMessages: 0,
      violations: [],
      recommendations: [],
    };
  }

  // Update compliance settings for client
  async updateComplianceSettings(clientId, settings) {
    // Update client compliance settings
    // This would typically update the database

    return {
      success: true,
      updatedSettings: settings,
    };
  }
}

module.exports = new ComplianceService();
