import { type Href } from "expo-router";

const HOME_PATH = "/(app)/(tabs)";

// Must match the Expo URL scheme declared in app.config.ts.
const APP_SCHEME = "vagabond-app";

const SCHEME_PATTERN = /^([a-z][a-z0-9+\-.]*):\/\/(.*)$/i;

export const parseDeepLink = (deepLink: string | undefined): Href => {
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

  const path = rest.startsWith("/") ? rest : `/${rest}`;
  // With generated typed routes (.expo/types, local dev) a plain string is
  // not assignable to Href, hence the assertion. It must stay outside the
  // return position: there, the CI env (no .expo/types, loose Href) flags it
  // via @typescript-eslint/no-unnecessary-type-assertion.
  const href = path as Href;
  return href;
};
