export const logger = {
  info: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console -- custom logger function
    console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console -- custom logger function
    console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console -- custom logger function
    console.error(...args);
  },
};
