import {
  getCrashlytics,
  isCrashlyticsCollectionEnabled,
  log,
  recordError,
  setAttribute,
  setAttributes,
  setCrashlyticsCollectionEnabled,
  setUserId,
} from "@react-native-firebase/crashlytics";

import type { AnalyticsUserContext, IAnalyticsService } from "./types";

export class CrashlyticsService implements IAnalyticsService {
  private isInitialized = false;

  initialize(): void {
    try {
      log(getCrashlytics(), "App initialized with Crashlytics");
      this.isInitialized = true;
    } catch (error) {
      recordError(
        getCrashlytics(),
        new Error(`Crashlytics initialization failed: ${String(error)}`),
      );
    }
  }

  async setUserContext(userContext: AnalyticsUserContext): Promise<void> {
    if (!this.isInitialized) return;

    try {
      if (userContext.email !== undefined) {
        await setUserId(getCrashlytics(), userContext.email);
      }

      const attributes: Record<string, string> = {};
      if (userContext.displayName !== undefined)
        attributes.display_name = userContext.displayName;
      if (userContext.signInMethod !== undefined)
        attributes.sign_in_method = userContext.signInMethod;
      if (userContext.sessionStartTime !== undefined)
        attributes.session_start_time = userContext.sessionStartTime;
      if (userContext.role !== undefined)
        attributes.user_role = userContext.role;

      if (Object.keys(attributes).length > 0) {
        await setAttributes(getCrashlytics(), attributes);
      }
    } catch (error) {
      recordError(
        getCrashlytics(),
        new Error(`Failed to set user context: ${String(error)}`),
      );
    }
  }

  async clearUserContext(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await setUserId(getCrashlytics(), "");
      await setAttributes(getCrashlytics(), {
        display_name: "",
        sign_in_method: "",
        session_start_time: "",
        user_role: "",
      });
    } catch (error) {
      recordError(
        getCrashlytics(),
        new Error(`Failed to clear user context: ${String(error)}`),
      );
    }
  }

  async setAttributes(attributes: Record<string, string>): Promise<void> {
    if (!this.isInitialized) return;
    try {
      await setAttributes(getCrashlytics(), attributes);
    } catch {
      // Silently fail if crashlytics fails
    }
  }

  async setAttribute(key: string, value: string): Promise<void> {
    if (!this.isInitialized) return;
    try {
      await setAttribute(getCrashlytics(), key, value);
    } catch {
      // Silently fail if crashlytics fails
    }
  }

  logCustomEvent(
    eventName: string,
    eventData?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.isInitialized) return Promise.resolve();
    let logMessage = `[CUSTOM_EVENT] ${eventName}`;
    if (eventData !== undefined) {
      logMessage += ` | Data: ${JSON.stringify(eventData)}`;
    }
    log(getCrashlytics(), logMessage);
    return Promise.resolve();
  }

  recordError(
    error: Error,
    context?: string,
    additionalData?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.isInitialized) return Promise.resolve();

    try {
      if (context !== undefined || additionalData !== undefined) {
        const contextInfo = [];
        if (context !== undefined) contextInfo.push(`Context: ${context}`);
        if (additionalData !== undefined)
          contextInfo.push(`Data: ${JSON.stringify(additionalData)}`);
        log(getCrashlytics(), `[ERROR_CONTEXT] ${contextInfo.join(" | ")}`);
      }
      recordError(getCrashlytics(), error);
    } catch {
      // Silently fail if crashlytics fails
    }
    return Promise.resolve();
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  // Crashlytics-specific methods
  isCrashlyticsEnabled(): boolean {
    return isCrashlyticsCollectionEnabled(getCrashlytics());
  }

  async setCrashlyticsEnabled(enabled: boolean): Promise<void> {
    try {
      await setCrashlyticsCollectionEnabled(getCrashlytics(), enabled);
    } catch {
      // Silently fail if crashlytics fails
    }
  }
}
