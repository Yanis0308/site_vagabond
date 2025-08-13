import { IncomingWebhook } from "@slack/webhook";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    slack: {
      sendMessage: (message: string) => Promise<void>;
    };
  }
}

export default fp(
  (fastify) => {
    const slackConfig = fastify.config.slack;
    const webhook = new IncomingWebhook(slackConfig.webhookUrl);

    const slackService: {
      sendMessage: (message: string) => Promise<void>;
    } = {
      async sendMessage(message: string) {
        try {
          await webhook.send({
            text: message,
            channel: fastify.config.slack.channel,
            username: "Vagabond API",
            icon_emoji: ":robot_face:",
          });
          fastify.log.info(`Slack message sent: ${message}`);
        } catch (error) {
          fastify.log.error("Failed to send Slack message:", error);
        }
      },
    };

    fastify.decorate("slack", slackService);
  },
  {
    name: "slack",
    dependencies: ["custom-config"],
  },
);
