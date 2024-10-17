import { Platform } from "react-native";

export const logger = (...messages: unknown[]): void => {
  //eslint-disable-next-line no-console -- allow for logger function
  console.log(`[${Platform.OS}] |`, ...messages);
};
