import { customEvent, vexo } from "vexo-analytics";

import { config } from "@/constants/Config";
import { logger } from "@/utils/logger";

import type { AnalyticsUserContext, IAnalyticsService } from "./types";

export class VexoService implements IAnalyticsService {
  private isInitialized = false;
  private currentUserContext: AnalyticsUserContext | null = null;
  private currentVexoApiKey: string | null = null;
  private isCurrentUserAdmin = false;

  initialize(): Promise<void> {
    try {
      // Initialize Vexo with basic user API key by default
      this.initializeVexoForRole({ isAdmin: false }); // false = user (not admin)
      this.isInitialized = true;
      logger("Vexo service initialized successfully with user API key");
    } catch (error) {
      logger("Vexo initialization failed:", error);
    }
    return Promise.resolve();
  }

  async setUserContext(userContext: AnalyticsUserContext): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.currentUserContext = userContext;
      const wasAdmin = this.isCurrentUserAdmin;
      this.isCurrentUserAdmin = userContext.role === "ADMIN";

      // Change Vexo API key only if role changed (user -> admin or admin -> user)
      if (wasAdmin !== this.isCurrentUserAdmin) {
        this.initializeVexoForRole({ isAdmin: this.isCurrentUserAdmin });
        logger(
          `Vexo API key changed to ${this.isCurrentUserAdmin ? "admin" : "user"} role`,
        );
      }

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
      this.isCurrentUserAdmin = false;

      // Reset to basic user API key when user logs out
      this.initializeVexoForRole({ isAdmin: false }); // false = user (not admin)
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

  // Vexo-specific private methods
  private initializeVexoForRole({ isAdmin }: { isAdmin: boolean }): void {
    const apiKey = isAdmin ? config.vexoApiKeyAdmin : config.vexoApiKey;
    if (this.currentVexoApiKey !== apiKey) {
      vexo(apiKey);
      this.currentVexoApiKey = apiKey;
      logger(`Vexo initialized with ${isAdmin ? "admin" : "user"} API key`);
    }
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

  // Public method to get current user role for external use
  getIsCurrentUserAdmin(): boolean {
    return this.isCurrentUserAdmin;
  }
}
