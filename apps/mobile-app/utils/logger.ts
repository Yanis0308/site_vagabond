import { Platform } from "react-native";

export const logger = (...messages: unknown[]): void => {
  //eslint-disable-next-line no-console -- allow for logger function
  console.log(`[${Platform.OS}] |`, ...messages);
};

const timers = new Map<string, number>();
export const logTimeStart = (label: string): void => {
  timers.set(label, Date.now());
};
export const logTimeEnd = (label: string): void => {
  const startTime = timers.get(label);
  if (startTime !== undefined) {
    const duration = Date.now() - startTime;
    logger(`⏱️ ${label} took ${duration}ms`);
  }
};
