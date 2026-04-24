import { WebClient } from "@slack/web-api";
import { type UserFeedbackCategory } from "@vagabond/shared-utils";
import fp from "fastify-plugin";

import { captureAndLog, getLogger } from "../utils/logger.js";

interface UserFeedbackSlackMessageData {
  category: UserFeedbackCategory;
  userDisplayName: string;
  userFullName: string;
  userEmail: string;
  targetPoiName: string;
  targetPoiId: string;
  targetPoiLocation: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  os: string;
  appVersion: string;
  message: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

const escapeSlackText = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
};

const formatSlackEmojiLine = (
  emoji: string,
  label: string,
  value: string,
): string => {
  return `${emoji} *${escapeSlackText(label)}:* ${value}`;
};

const formatSlackMessageBody = (message: string): string => {
  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    return "—";
  }

  return trimmedMessage
    .split("\n")
    .map((line) => `> ${escapeSlackText(line)}`)
    .join("\n");
};

const formatSlackUser = (
  displayName: string,
  fullName: string,
  email: string,
): string => {
  if (fullName.length > 0 && displayName !== fullName) {
    return `${displayName} (${fullName} · ${email})`;
  }

  return `${displayName} (${email})`;
};

const formatSlackPayload = (payload: Record<string, unknown>): string => {
  const entries = Object.entries(payload);

  if (entries.length === 0) {
    return "—";
  }

  return entries
    .map(([key, value]) => {
      const formattedValue =
        typeof value === "string" ? value : JSON.stringify(value);

      return `• ${escapeSlackText(key)}: ${escapeSlackText(formattedValue)}`;
    })
    .join("\n");
};

const formatSlackCoordinates = (
  latitude: number | null,
  longitude: number | null,
): string => {
  if (latitude === null || longitude === null) {
    return "—";
  }

  return `${latitude}, ${longitude}`;
};

const buildUserFeedbackSlackMessage = ({
  userDisplayName,
  userFullName,
  userEmail,
  category,
  targetPoiName,
  targetPoiId,
  targetPoiLocation,
  city,
  latitude,
  longitude,
  os,
  appVersion,
  message,
  payload,
  createdAt,
}: UserFeedbackSlackMessageData): string => {
  const formattedUser = formatSlackUser(
    escapeSlackText(userDisplayName),
    escapeSlackText(userFullName),
    escapeSlackText(userEmail),
  );

  return [
    "📝 *Nouveau feedback utilisateur reçu !*",
    formatSlackEmojiLine("👤", "Utilisateur", formattedUser),
    formatSlackEmojiLine("🏷️", "Catégorie", escapeSlackText(category)),
    formatSlackEmojiLine(
      "📍",
      "POI cible",
      `${escapeSlackText(targetPoiName)} (${escapeSlackText(targetPoiId)})`,
    ),
    formatSlackEmojiLine(
      "🧭",
      "Localisation POI",
      escapeSlackText(targetPoiLocation),
    ),
    formatSlackEmojiLine("🏙️", "Ville", escapeSlackText(city)),
    formatSlackEmojiLine(
      "🌍",
      "Coordonnées",
      formatSlackCoordinates(latitude, longitude),
    ),
    formatSlackEmojiLine(
      "📱",
      "App",
      `${escapeSlackText(os)} ${escapeSlackText(appVersion)}`,
    ),
    `💬 *Message:*\n${formatSlackMessageBody(message)}`,
    `🧩 *Payload:*\n${formatSlackPayload(payload)}`,
    formatSlackEmojiLine(
      "📅",
      "Date",
      escapeSlackText(createdAt.toLocaleString("fr-FR")),
    ),
  ].join("\n");
};

declare module "fastify" {
  interface FastifyInstance {
    slack: {
      sendSignupMessage: (message: string) => Promise<void>;
      sendPoiValidationMessage: (message: string) => Promise<void>;
      sendAppReviewMessage: (message: string) => Promise<void>;
      sendUserFeedbackMessage: (
        data: UserFeedbackSlackMessageData,
      ) => Promise<void>;
    };
  }
}

export default fp(
  (fastify) => {
    const slackConfig = fastify.config.slack;
    const client = new WebClient(slackConfig.botToken);
    const channelSignups = slackConfig.channelSignups;
    const channelPoiValidations = slackConfig.channelPoiValidations;
    const channelAppReviews = slackConfig.channelAppReviews;

    const sendMessage = async (
      message: string,
      channel: string,
    ): Promise<void> => {
      try {
        await client.chat.postMessage({
          text: message,
          channel: channel,
          username: "Vagabond API",
          icon_emoji: ":robot_face:",
        });
        getLogger(fastify).info(`Slack message sent to ${channel}`);
      } catch (err) {
        captureAndLog(fastify, err, "Failed to send Slack message", {
          level: "warning",
          tags: { operation: "slack-send-message" },
        });
      }
    };

    const slackService: {
      sendSignupMessage: (message: string) => Promise<void>;
      sendPoiValidationMessage: (message: string) => Promise<void>;
      sendAppReviewMessage: (message: string) => Promise<void>;
      sendUserFeedbackMessage: (
        data: UserFeedbackSlackMessageData,
      ) => Promise<void>;
    } = {
      sendSignupMessage: (message: string) =>
        sendMessage(message, channelSignups),
      sendPoiValidationMessage: (message: string) =>
        sendMessage(message, channelPoiValidations),
      sendAppReviewMessage: (message: string) =>
        sendMessage(message, channelAppReviews),
      sendUserFeedbackMessage: (data: UserFeedbackSlackMessageData) =>
        sendMessage(
          buildUserFeedbackSlackMessage(data),
          slackConfig.channelUserFeedbackByCategory[data.category],
        ),
    };

    fastify.decorate("slack", slackService);
  },
  {
    name: "slack",
    dependencies: ["custom-config"],
  },
);
