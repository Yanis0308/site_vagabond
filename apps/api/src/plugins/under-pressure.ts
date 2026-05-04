import underPressurePlugin from "@fastify/under-pressure";
import fp from "fastify-plugin";

import { shutdownState } from "../lib/shutdown-state.js";
import { getLogger } from "../utils/logger.js";

export default fp(
  async (fastify) => {
    const heapLimitBytes =
      Math.floor(fastify.config.serverMemoryMb * 0.7) * 1024 * 1024;
    const rssLimitBytes =
      Math.floor(fastify.config.serverMemoryMb * 0.8) * 1024 * 1024;

    await fastify.register(underPressurePlugin, {
      maxEventLoopDelay: 1000,
      maxEventLoopUtilization: 0.98,
      maxHeapUsedBytes: heapLimitBytes,
      maxRssBytes: rssLimitBytes,
      retryAfter: 10,
      exposeStatusRoute: false,
      healthCheckInterval: 10_000,
      healthCheck: async () => {
        if (shutdownState.isShuttingDown) {
          return false;
        }
        try {
          await fastify.dbPing();
          return true;
        } catch (error) {
          getLogger(fastify).warn(
            { err: error },
            "under-pressure healthCheck: database ping failed",
          );
          return false;
        }
      },
    });
  },
  {
    name: "under-pressure",
    dependencies: ["fastify-drizzle", "custom-config"],
  },
);
