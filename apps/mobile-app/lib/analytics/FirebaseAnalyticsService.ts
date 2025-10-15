import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setDefaultEventParameters,
  setSessionTimeoutDuration,
  setUserId,
  setUserProperties,
} from "@react-native-firebase/analytics";

import { logger } from "@/utils/logger";

import type { AnalyticsUserContext, IAnalyticsService } from "./types";

export class FirebaseAnalyticsService implements IAnalyticsService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      await setAnalyticsCollectionEnabled(getAnalytics(), true);
      this.isInitialized = true;
      await getAnalytics().logEvent("analytics_service_initialized", {
        service: "firebase_analytics",
      });
      logger("Firebase Analytics service initialized successfully");
    } catch (error) {
      logger("Firebase Analytics initialization failed:", error);
    }
  }

  async setUserContext(userContext: AnalyticsUserContext): Promise<void> {
    if (!this.isInitialized) return;

    try {
      if (userContext.userId !== undefined) {
        await setUserId(getAnalytics(), userContext.userId);
      }

      const userProperties: Record<string, string> = {};
      if (userContext.displayName !== undefined)
        userProperties.display_name = userContext.displayName;
      if (userContext.signInMethod !== undefined)
        userProperties.sign_in_method = userContext.signInMethod;
      if (userContext.email !== undefined)
        userProperties.email = userContext.email;
      if (userContext.role !== undefined)
        userProperties.user_role = userContext.role;

      await setUserProperties(getAnalytics(), userProperties);

      logger("Firebase Analytics user context set", {
        userId: userContext.userId,
        signInMethod: userContext.signInMethod,
      });
    } catch (error) {
      logger("Failed to set Firebase Analytics user context:", error);
    }
  }

  async clearUserContext(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await setUserId(getAnalytics(), null);
      await setUserProperties(getAnalytics(), {
        display_name: null,
        sign_in_method: null,
        email: null,
        email_verified: null,
        user_role: null,
      });

      await logEvent(getAnalytics(), "user_signed_out");
      logger("Firebase Analytics user context cleared");
    } catch (error) {
      logger("Failed to clear Firebase Analytics user context:", error);
    }
  }

  async setAttributes(attributes: Record<string, string>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await setDefaultEventParameters(getAnalytics(), attributes);
      logger("Firebase Analytics default parameters set", attributes);
    } catch (error) {
      logger("Failed to set Firebase Analytics default parameters:", error);
    }
  }

  async setAttribute(key: string, value: string): Promise<void> {
    await this.setAttributes({ [key]: value });
  }

  async logCustomEvent(
    eventName: string,
    eventData?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await logEvent(getAnalytics(), eventName, eventData);
      logger(`Firebase Analytics event logged: ${eventName}`, eventData);
    } catch (error) {
      logger("Failed to log Firebase Analytics event:", error);
    }
  }

  async recordError(
    error: Error,
    context?: string,
    additionalData?: Record<string, unknown>,
  ): Promise<void> {
    await this.logCustomEvent("error_occurred", {
      error_message: error.message,
      error_name: error.name,
      context,
      ...additionalData,
    });
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  // Firebase Analytics-specific methods
  async setAnalyticsCollectionEnabled(enabled: boolean): Promise<void> {
    try {
      await setAnalyticsCollectionEnabled(getAnalytics(), enabled);
      logger(
        `Firebase Analytics collection ${enabled ? "enabled" : "disabled"}`,
      );
    } catch (error) {
      logger("Failed to set Firebase Analytics collection enabled:", error);
    }
  }

  async setSessionTimeoutDuration(milliseconds: number): Promise<void> {
    try {
      await setSessionTimeoutDuration(getAnalytics(), milliseconds);
      logger(`Firebase Analytics session timeout set to ${milliseconds}ms`);
    } catch (error) {
      logger("Failed to set Firebase Analytics session timeout:", error);
    }
  }
}
