// Read the .env file.
import * as dotenv from "dotenv";
dotenv.config();

import * as Sentry from "@sentry/node";
// Require the framework
// Require library to exit fastify process, gracefully (if possible)
import closeWithGrace from "close-with-grace";
import Fastify from "fastify";

import { loggerConfig } from "./lib/logger.js";
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
closeWithGrace({ delay: 500 }, async function ({ err }) {
  if (err !== undefined) {
    captureAndLog(app, err, "Server shutdown error");
  }
  await Sentry.close(2000);
  await app.close();
} as closeWithGrace.CloseWithGraceAsyncCallback);

const start = async (): Promise<void> => {
  try {
    const port = 3000;

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
