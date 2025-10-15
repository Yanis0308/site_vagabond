import { customEvent, vexo } from "vexo-analytics";

import { config } from "@/constants/Config";
import { logger } from "@/utils/logger";

import type { AnalyticsUserContext, IAnalyticsService } from "./types";

export class VexoService implements IAnalyticsService {
  private isInitialized = false;
  private currentUserContext: AnalyticsUserContext | null = null;
  private isCurrentUserAdmin = false;

  initialize(): Promise<void> {
    try {
      vexo(config.vexoApiKey);
      this.isInitialized = true;
      logger("Vexo service initialized successfully with API key");
    } catch (error) {
      logger("Vexo initialization failed:", error);
    }
    return Promise.resolve();
  }

  async setUserContext(userContext: AnalyticsUserContext): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.currentUserContext = userContext;

      // Track authentication events
      const isNewUser = userContext.creationTime === userContext.lastSignInTime;
      const provider = userContext.signInMethod ?? "unknown";

      if (isNewUser && userContext.userId !== undefined) {
        await this.trackUserRegistration(
          provider,
          userContext.creationTime ?? null,
          userContext.userId,
        );
      }

      logger("Vexo user context set", {
        userId: userContext.userId,
        isAdmin: this.isCurrentUserAdmin,
      });
    } catch (error) {
      logger("Failed to set Vexo user context:", error);
    }
  }

  async clearUserContext(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const userId = this.currentUserContext?.userId;
      await this.trackUserLogout(userId);

      this.currentUserContext = null;

      logger("Vexo user context cleared, reset to user API key");
    } catch (error) {
      logger("Failed to clear Vexo user context:", error);
    }
  }

  setAttributes(attributes: Record<string, string>): Promise<void> {
    // Vexo doesn't support setting global attributes like other services
    // We could store them and include in future events if needed
    logger("Vexo attributes set (stored for future events)", attributes);
    return Promise.resolve();
  }

  async setAttribute(key: string, value: string): Promise<void> {
    await this.setAttributes({ [key]: value });
  }

  logCustomEvent(
    eventName: string,
    eventData?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.isInitialized) return Promise.resolve();

    try {
      customEvent(eventName, eventData ?? {});
      logger(
        "Vexo event tracked:",
        eventName,
        eventData,
        `Role: ${this.isCurrentUserAdmin ? "admin" : "user"}`,
      );
    } catch (error) {
      logger("Failed to track Vexo event:", error);
    }
    return Promise.resolve();
  }

  async recordError(
    error: Error,
    context?: string,
    additionalData?: Record<string, unknown>,
  ): Promise<void> {
    // Vexo doesn't typically handle error tracking
    // We could log it as a custom event if needed
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

  private async trackUserRegistration(
    provider: string,
    registrationTime: string | null,
    userId: string,
  ): Promise<void> {
    await this.logCustomEvent("user_registration", {
      provider,
      registration_time: registrationTime,
      user_id: userId,
    });
  }

  private async trackUserLogout(userId?: string): Promise<void> {
    await this.logCustomEvent("user_logout", {
      user_id: userId,
    });
  }
}
