const twilio = require("twilio");
const axios = require("axios");

class MMSService {
  constructor() {
    this.providers = {
      twilio: this.twilioProvider.bind(this),
      bandwidth: this.bandwidthProvider.bind(this),
      messagebird: this.messagebirdProvider.bind(this),
    };
  }

  async sendMessage(message, client) {
    const provider = client.mmsSettings.provider || "twilio";
    const providerFunction = this.providers[provider];

    if (!providerFunction) {
      throw new Error(`Unsupported MMS provider: ${provider}`);
    }

    return await providerFunction(message, client);
  }

  async twilioProvider(message, client) {
    const { accountSid, authToken, fromNumber } =
      client.mmsSettings.apiCredentials;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio credentials not configured");
    }

    const client_twilio = twilio(accountSid, authToken);

    try {
      const messageData = {
        from: fromNumber,
        to: message.recipient.phoneNumber,
        body: message.content.text,
      };

      // Add media if present
      if (message.content.media && message.content.media.length > 0) {
        messageData.mediaUrl = message.content.media.map((media) => media.url);
      }

      const result = await client_twilio.messages.create(messageData);

      return {
        messageId: result.sid,
        response: result,
        provider: "twilio",
      };
    } catch (error) {
      console.error("Twilio send error:", error);
      throw new Error(`Twilio error: ${error.message}`);
    }
  }

  async bandwidthProvider(message, client) {
    const { accountId, username, password, fromNumber } =
      client.mmsSettings.apiCredentials;

    if (!accountId || !username || !password || !fromNumber) {
      throw new Error("Bandwidth credentials not configured");
    }

    try {
      const messageData = {
        from: fromNumber,
        to: message.recipient.phoneNumber,
        text: message.content.text,
        media: message.content.media?.map((media) => media.url) || [],
      };

      const response = await axios.post(
        `https://messaging.bandwidth.com/api/v2/users/${accountId}/messages`,
        messageData,
        {
          auth: {
            username: username,
            password: password,
          },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        messageId: response.data.id,
        response: response.data,
        provider: "bandwidth",
      };
    } catch (error) {
      console.error("Bandwidth send error:", error);
      throw new Error(
        `Bandwidth error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async messagebirdProvider(message, client) {
    const { apiKey, fromNumber } = client.mmsSettings.apiCredentials;

    if (!apiKey || !fromNumber) {
      throw new Error("MessageBird credentials not configured");
    }

    try {
      const messageData = {
        originator: fromNumber,
        recipients: [message.recipient.phoneNumber],
        body: message.content.text,
        mediaUrls: message.content.media?.map((media) => media.url) || [],
      };

      const response = await axios.post(
        "https://rest.messagebird.com/messages",
        messageData,
        {
          headers: {
            Authorization: `AccessKey ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        messageId: response.data.id,
        response: response.data,
        provider: "messagebird",
      };
    } catch (error) {
      console.error("MessageBird send error:", error);
      throw new Error(
        `MessageBird error: ${
          error.response?.data?.errors?.[0]?.description || error.message
        }`
      );
    }
  }

  async getDeliveryStatus(messageId, provider, client) {
    const providerFunction = this.providers[provider];

    if (!providerFunction) {
      throw new Error(`Unsupported MMS provider: ${provider}`);
    }

    return await providerFunction.getStatus(messageId, client);
  }

  async twilioGetStatus(messageId, client) {
    const { accountSid, authToken } = client.mmsSettings.apiCredentials;
    const client_twilio = twilio(accountSid, authToken);

    try {
      const message = await client_twilio.messages(messageId).fetch();

      return {
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        dateSent: message.dateSent,
      };
    } catch (error) {
      console.error("Twilio status error:", error);
      throw new Error(`Twilio status error: ${error.message}`);
    }
  }

  async bandwidthGetStatus(messageId, client) {
    const { accountId, username, password } = client.mmsSettings.apiCredentials;

    try {
      const response = await axios.get(
        `https://messaging.bandwidth.com/api/v2/users/${accountId}/messages/${messageId}`,
        {
          auth: {
            username: username,
            password: password,
          },
        }
      );

      return {
        status: response.data.state,
        errorCode: response.data.errorCode,
        errorMessage: response.data.errorMessage,
        dateCreated: response.data.time,
        dateUpdated: response.data.time,
      };
    } catch (error) {
      console.error("Bandwidth status error:", error);
      throw new Error(
        `Bandwidth status error: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async messagebirdGetStatus(messageId, client) {
    const { apiKey } = client.mmsSettings.apiCredentials;

    try {
      const response = await axios.get(
        `https://rest.messagebird.com/messages/${messageId}`,
        {
          headers: {
            Authorization: `AccessKey ${apiKey}`,
          },
        }
      );

      return {
        status: response.data.status,
        errorCode: response.data.errors?.[0]?.code,
        errorMessage: response.data.errors?.[0]?.description,
        dateCreated: response.data.createdDatetime,
        dateUpdated: response.data.updatedDatetime,
      };
    } catch (error) {
      console.error("MessageBird status error:", error);
      throw new Error(
        `MessageBird status error: ${
          error.response?.data?.errors?.[0]?.description || error.message
        }`
      );
    }
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  // Format phone number for specific provider
  formatPhoneNumber(phoneNumber, provider) {
    if (!this.validatePhoneNumber(phoneNumber)) {
      throw new Error("Invalid phone number format");
    }

    // Ensure phone number starts with + for international format
    if (!phoneNumber.startsWith("+")) {
      // Assume US number if no country code
      if (phoneNumber.length === 10) {
        return `+1${phoneNumber}`;
      }
      return `+${phoneNumber}`;
    }

    return phoneNumber;
  }

  // Calculate message cost based on content and provider
  calculateMessageCost(message, provider) {
    let baseCost = 0.01; // Base cost in USD

    // Add cost for media
    if (message.content.media && message.content.media.length > 0) {
      baseCost += message.content.media.length * 0.02; // $0.02 per media file
    }

    // Provider-specific pricing
    switch (provider) {
      case "twilio":
        return baseCost * 1.2; // 20% markup
      case "bandwidth":
        return baseCost * 0.8; // 20% discount
      case "messagebird":
        return baseCost * 1.1; // 10% markup
      default:
        return baseCost;
    }
  }
}

module.exports = new MMSService();
