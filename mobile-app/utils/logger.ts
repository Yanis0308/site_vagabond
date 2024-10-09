import { Platform } from "react-native";

export const log = (...messages: unknown[]) => {
  console.log(`[${Platform.OS}] |`, ...messages);
};
