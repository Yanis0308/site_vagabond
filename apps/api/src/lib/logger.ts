import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

const loggerOptions = isDev
  ? {
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    }
  : {};

/** Shared Pino logger for use in utilities and services outside request context. */
export const log = pino(loggerOptions);

/** Logger config for Fastify (Fastify 5 does not accept pre-instantiated logger). */
export const loggerConfig = isDev ? loggerOptions : true;
