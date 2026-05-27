// Read the .env file.
import * as dotenv from "dotenv";
dotenv.config();

import * as Sentry from "@sentry/node";
// Require the framework
// Require library to exit fastify process, gracefully (if possible)
import closeWithGrace from "close-with-grace";
import Fastify from "fastify";

import { loggerConfig } from "./lib/logger.js";
import { shutdownState } from "./lib/shutdown-state.js";
import { getListenPort } from "./plugins/config.js";
import { captureAndLog } from "./utils/logger.js";

// Instantiate Fastify with shared logger config (Fastify 5 does not accept pre-instantiated logger)
const app = Fastify({
  logger: loggerConfig,
  pluginTimeout: 120_000,
});

const CLIENT_DISCONNECT_MESSAGES = ["Premature close", "aborted", "ECONNRESET"];

function isClientDisconnectError(error: unknown): boolean {
  const result =
    error instanceof Error &&
    CLIENT_DISCONNECT_MESSAGES.some((msg) => error.message.includes(msg));
  if (result) {
    app.log.warn(error, "Client disconnected");
  }
  return result;
}

Sentry.setupFastifyErrorHandler(app, {
  shouldHandleError(error) {
    return !isClientDisconnectError(error);
  },
});

// Register your application as a normal plugin.
app.register(import("./app.js"));

// delay is the number of milliseconds for the graceful close to finish
closeWithGrace({ delay: 30_000 }, async function ({ signal, err }) {
  shutdownState.isShuttingDown = true;
  app.log.info(
    { signal },
    "Shutdown signal received, /api/ready will return 503",
  );

  if (err !== undefined) {
    captureAndLog(app, err, "Server shutdown error");
  }

  // Drain on Fly only: let the LB notice /api/ready=503 before we close sockets.
  // Fly check interval = 15s (api-*-fly.toml) + 5s margin → 20s.
  //
  // Hypothesis: a single failed /api/ready check is enough for Fly Proxy to pull
  // the machine from rotation. The Fly docs only state "if a Machine fails its
  // service check, it will be marked as unhealthy by the proxy" without
  // specifying whether N consecutive failures are required. If empirical testing
  // shows in-flight requests get dropped during a deploy, bump this to ~30s
  // (2 × interval) to cover a 2-failed-checks threshold.
  //
  // Optional chaining: covers the edge case where the signal arrives before
  // the config plugin finished decorating the instance — the type says
  // `config: Config` (non-nullable) but at runtime it can be undefined here.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- app.config is non-null per FastifyInstance type but can be undefined during early boot before plugins finished registering
  if (app.config?.appServerName !== undefined) {
    await new Promise((resolve) => setTimeout(resolve, 20_000));
  }

  await Sentry.close(2000);
  await app.close();
} as closeWithGrace.CloseWithGraceAsyncCallback);

const start = async (): Promise<void> => {
  try {
    const port = getListenPort();

    await app.listen({
      port,
      host: "0.0.0.0", // Listen on all interfaces
    });

    app.log.info(`Server listening on port ${port}`);
  } catch (err) {
    app.log.error(
      { err, errStr: JSON.stringify(err) },
      "Error starting server",
    );
    process.exit(1);
  }
};

void start();
