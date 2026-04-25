import { useSegments } from "expo-router";
import { useEffect, useRef } from "react";

import { trackScreen } from "./analytics";

/**
 * Joins raw Expo Router segments into a single screen name, preserving
 * group segments (e.g. `(tabs)`) and dynamic markers (e.g. `[userId]`)
 * so the navigation tree shape stays visible in analytics.
 *
 * Examples:
 *   ['(app)', '(tabs)', 'profile']        → "(app)/(tabs)/profile"
 *   ['(app)', 'user', '[userId]']         → "(app)/user/[userId]"
 *   ['(app)', 'validate-place', 'review-form'] → "(app)/validate-place/review-form"
 *   []                                    → "root"
 */
export const segmentsToScreenName = (segments: string[]): string =>
  segments.length === 0 ? "root" : segments.join("/");

/**
 * Subscribes to the current URL segments and reports each distinct screen to analytics.
 * Skips duplicate emissions when the screen name is unchanged.
 */
export const useScreenTracking = (): void => {
  const segments = useSegments();
  const previousRef = useRef<string | null>(null);

  useEffect(() => {
    const screenName = segmentsToScreenName([...segments]);
    if (screenName === previousRef.current) return;
    previousRef.current = screenName;
    void trackScreen(screenName);
  }, [segments]);
};
