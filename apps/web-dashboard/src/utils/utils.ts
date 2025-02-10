export const logger = {
  info: (...messages: unknown[]): void => {
    // eslint-disable-next-line no-console -- logger
    console.log(...messages);
  },
  error: (...messages: unknown[]): void => {
    // eslint-disable-next-line no-console -- logger
    console.error(...messages);
  },
};
