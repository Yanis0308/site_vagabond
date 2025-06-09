// Read the .env file.
import * as dotenv from "dotenv";
dotenv.config();

// Require the framework
// Require library to exit fastify process, gracefully (if possible)
import closeWithGrace from "close-with-grace";
import Fastify from "fastify";

import { isDev } from "./plugins/config.js";

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
};

// Instantiate Fastify with some config
const app = Fastify({
  logger: isDev ? envToLogger.development : envToLogger.production,
});

// Register your application as a normal plugin.
app.register(import("./app.js"));

// delay is the number of milliseconds for the graceful close to finish
closeWithGrace({ delay: 500 }, async function ({ err }) {
  if (err !== undefined) {
    app.log.error(err);
  }
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
