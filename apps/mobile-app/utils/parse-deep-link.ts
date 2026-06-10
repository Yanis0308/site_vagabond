const HOME_PATH = "/(app)/(tabs)";

// Must match the Expo URL scheme declared in app.config.ts.
const APP_SCHEME = "vagabond-app";

const SCHEME_PATTERN = /^([a-z][a-z0-9+\-.]*):\/\/(.*)$/i;

export const parseDeepLink = (deepLink: string | undefined): string => {
  if (deepLink === undefined || deepLink === "") {
    return HOME_PATH;
  }

  const match = SCHEME_PATTERN.exec(deepLink);
  if (match === null) {
    return HOME_PATH;
  }

  const [, scheme = "", rest = ""] = match;
  if (scheme.toLowerCase() !== APP_SCHEME) {
    return HOME_PATH;
  }

  if (rest === "") {
    return HOME_PATH;
  }

  return rest.startsWith("/") ? rest : `/${rest}`;
};
