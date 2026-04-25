import {
  getAnalytics,
  logEvent as fbLogEvent,
  logScreenView as fbLogScreenView,
  setUserId as fbSetUserId,
  setUserProperties,
} from "@react-native-firebase/analytics";
import {
  getCrashlytics,
  log as crashLog,
  recordError as crashRecordError,
  setAttribute as crashSetAttribute,
  setAttributes as crashSetAttributes,
  setUserId as crashSetUserId,
} from "@react-native-firebase/crashlytics";

import { logger } from "@/utils/logger";

import { type EventName, type EventParams } from "./events";

export interface AnalyticsUser {
  userId: string;
  email?: string;
  displayName?: string;
  signInMethod?: string;
}

// Vendor limits — values exceeding these are silently dropped or rejected by
// the SDKs, so we truncate at our boundary to keep the call sites clean.
const FB_PARAM_VALUE_MAX = 100; // Firebase Analytics event param (string)
const FB_USER_PROP_VALUE_MAX = 36; // Firebase Analytics user property (string)
const CRASH_ATTR_VALUE_MAX = 1024; // Crashlytics custom key value
const CRASH_LOG_MSG_MAX = 1024; // Crashlytics breadcrumb message

const truncate = (value: string, max: number): string =>
  value.length > max ? value.slice(0, max) : value;

const sanitizeEventParams = (
  params: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined => {
  if (params === undefined) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    out[key] =
      typeof value === "string" ? truncate(value, FB_PARAM_VALUE_MAX) : value;
  }
  return out;
};

const sanitizeStringRecord = (
  record: Record<string, string>,
  max: number,
): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = truncate(value, max);
  }
  return out;
};

const truncateUserProp = (value: string | undefined): string | null =>
  value === undefined ? null : truncate(value, FB_USER_PROP_VALUE_MAX);

const truncateUserAttr = (value: string | undefined): string =>
  value === undefined ? "" : truncate(value, CRASH_ATTR_VALUE_MAX);

type TrackEventArgs<K extends EventName> =
  EventParams<K> extends Record<string, never>
    ? [name: K]
    : [name: K, params: EventParams<K>];

export const trackEvent = async <K extends EventName>(
  ...args: TrackEventArgs<K>
): Promise<void> => {
  const [name, params] = args;
  if (__DEV__) logger("[analytics]", name, params);
  try {
    await fbLogEvent(
      getAnalytics(),
      name,
      sanitizeEventParams(params as Record<string, unknown> | undefined),
    );
  } catch (error) {
    logger("[analytics] logEvent failed", error);
  }
};

export const trackScreen = async (screenName: string): Promise<void> => {
  const safeName = truncate(screenName, FB_PARAM_VALUE_MAX);
  if (__DEV__) logger("[analytics] screen:", safeName);
  try {
    await fbLogScreenView(getAnalytics(), {
      screen_name: safeName,
      screen_class: safeName,
    });
    await crashSetAttribute(getCrashlytics(), "current_screen", safeName);
    crashLog(getCrashlytics(), `Screen: ${safeName}`);
  } catch (error) {
    logger("[analytics] trackScreen failed", error);
  }
};

export const identifyUser = async (user: AnalyticsUser): Promise<void> => {
  try {
    await fbSetUserId(getAnalytics(), user.userId);
    await crashSetUserId(getCrashlytics(), user.userId);
    await setUserProperties(getAnalytics(), {
      display_name: truncateUserProp(user.displayName),
      email: truncateUserProp(user.email),
      sign_in_method: truncateUserProp(user.signInMethod),
    });
    await crashSetAttributes(getCrashlytics(), {
      display_name: truncateUserAttr(user.displayName),
      email: truncateUserAttr(user.email),
      sign_in_method: truncateUserAttr(user.signInMethod),
    });
  } catch (error) {
    logger("[analytics] identifyUser failed", error);
  }
};

export const clearUser = async (): Promise<void> => {
  try {
    await fbSetUserId(getAnalytics(), null);
    await crashSetUserId(getCrashlytics(), "");
    await setUserProperties(getAnalytics(), {
      display_name: null,
      email: null,
      sign_in_method: null,
    });
  } catch (error) {
    logger("[analytics] clearUser failed", error);
  }
};

export const recordError = async (
  error: Error,
  ctx?: Record<string, string>,
): Promise<void> => {
  if (__DEV__) logger("[analytics] recordError", error.message, ctx);
  try {
    if (ctx !== undefined && Object.keys(ctx).length > 0) {
      await crashSetAttributes(
        getCrashlytics(),
        sanitizeStringRecord(ctx, CRASH_ATTR_VALUE_MAX),
      );
    }
    crashRecordError(getCrashlytics(), error);
  } catch (e) {
    logger("[analytics] recordError failed", e);
  }
};

export const setContext = async (
  ctx: Record<string, string>,
): Promise<void> => {
  try {
    await crashSetAttributes(
      getCrashlytics(),
      sanitizeStringRecord(ctx, CRASH_ATTR_VALUE_MAX),
    );
  } catch (error) {
    logger("[analytics] setContext failed", error);
  }
};

export const breadcrumb = (message: string): void => {
  try {
    crashLog(getCrashlytics(), truncate(message, CRASH_LOG_MSG_MAX));
  } catch (error) {
    logger("[analytics] breadcrumb failed", error);
  }
};
