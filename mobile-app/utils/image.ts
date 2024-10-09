import { config } from "@/constants/Config";

export const replaceLocalhost = (uri: string) => {
  if (config.isLocalDev) {
    const apiBaseUrlObject = new URL(config.apiBaseUrl);
    return uri.replace("localhost", apiBaseUrlObject.hostname);
  } else {
    return uri;
  }
};
