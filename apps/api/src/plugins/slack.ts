import { WebClient } from "@slack/web-api";
import fp from "fastify-plugin";

import { getLogger } from "../utils/logger.js";

declare module "fastify" {
  interface FastifyInstance {
    slack: {
      sendSignupMessage: (message: string) => Promise<void>;
      sendPoiValidationMessage: (message: string) => Promise<void>;
    };
  }
}

export default fp(
  (fastify) => {
    const slackConfig = fastify.config.slack;
    const client = new WebClient(slackConfig.botToken);
    const channelSignups = slackConfig.channelSignups;
    const channelPoiValidations = slackConfig.channelPoiValidations;

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
        getLogger(fastify).info(`Slack message sent to ${channel}: ${message}`);
      } catch (err) {
        getLogger(fastify).error({ err }, "Failed to send Slack message:");
      }
    };

    const slackService: {
      sendSignupMessage: (message: string) => Promise<void>;
      sendPoiValidationMessage: (message: string) => Promise<void>;
    } = {
      sendSignupMessage: (message: string) =>
        sendMessage(message, channelSignups),
      sendPoiValidationMessage: (message: string) =>
        sendMessage(message, channelPoiValidations),
    };

    fastify.decorate("slack", slackService);
  },
  {
    name: "slack",
    dependencies: ["custom-config"],
  },
);
