import crashlytics from "@react-native-firebase/crashlytics";

import type {
  AnalyticsAppContext,
  AnalyticsUserContext,
  IAnalyticsService,
} from "./types";

export class CrashlyticsService implements IAnalyticsService {
  private isInitialized = false;

  async initialize(appContext?: AnalyticsAppContext): Promise<void> {
    if (appContext === undefined) return;
    try {
      await Promise.all([
        crashlytics().setAttribute("app_environment", appContext.environment),
        crashlytics().setAttribute("app_version", appContext.version),
        crashlytics().setAttribute("platform", "mobile"),
      ]);

      crashlytics().log("App initialized with Crashlytics");
      this.isInitialized = true;
    } catch (error) {
      crashlytics().recordError(
        new Error(`Crashlytics initialization failed: ${String(error)}`),
      );
    }
  }

  async setUserContext(userContext: AnalyticsUserContext): Promise<void> {
    if (!this.isInitialized) return;

    try {
      if (userContext.email !== undefined) {
        await crashlytics().setUserId(userContext.email);
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
        await crashlytics().setAttributes(attributes);
      }
    } catch (error) {
      crashlytics().recordError(
        new Error(`Failed to set user context: ${String(error)}`),
      );
    }
  }

  async clearUserContext(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await crashlytics().setUserId("");
      await crashlytics().setAttributes({
        display_name: "",
        sign_in_method: "",
        session_start_time: "",
        user_role: "",
      });
    } catch (error) {
      crashlytics().recordError(
        new Error(`Failed to clear user context: ${String(error)}`),
      );
    }
  }

  async setAttributes(attributes: Record<string, string>): Promise<void> {
    if (!this.isInitialized) return;
    try {
      await crashlytics().setAttributes(attributes);
    } catch {
      // Silently fail if crashlytics fails
    }
  }

  async setAttribute(key: string, value: string): Promise<void> {
    if (!this.isInitialized) return;
    try {
      await crashlytics().setAttribute(key, value);
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
    crashlytics().log(logMessage);
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
        crashlytics().log(`[ERROR_CONTEXT] ${contextInfo.join(" | ")}`);
      }
      crashlytics().recordError(error);
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
    return crashlytics().isCrashlyticsCollectionEnabled;
  }

  async setCrashlyticsEnabled(enabled: boolean): Promise<void> {
    try {
      await crashlytics().setCrashlyticsCollectionEnabled(enabled);
    } catch {
      // Silently fail if crashlytics fails
    }
  }
}
