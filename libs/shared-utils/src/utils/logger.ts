export const logger = {
  info: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console -- custom logger function
    console.info(...args);
  },
  error: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console -- custom logger function
    console.error(...args);
  },
};
