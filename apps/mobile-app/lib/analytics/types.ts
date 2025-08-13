// Common interfaces for unified analytics
export interface AnalyticsUserContext {
  email?: string;
  displayName?: string;
  signInMethod?: string;
  sessionStartTime?: string;
  userId?: string;
  creationTime?: string;
  lastSignInTime?: string;
  role?: "ADMIN" | "USER";
}

export interface AnalyticsAppContext {
  environment: string;
  version: string;
}

// Base interface that all analytics services must implement
export interface IAnalyticsService {
  /**
   * Initialize the analytics service
   */
  initialize(appContext: AnalyticsAppContext): Promise<void>;

  /**
   * Set user context for the service
   */
  setUserContext(userContext: AnalyticsUserContext): Promise<void>;

  /**
   * Clear user context from the service
   */
  clearUserContext(): Promise<void>;

  /**
   * Set custom attributes/properties
   */
  setAttributes(attributes: Record<string, string>): Promise<void>;

  /**
   * Set a single attribute/property
   */
  setAttribute(key: string, value: string): Promise<void>;

  /**
  /**
   * Log a custom event
   */
  logCustomEvent(
    eventName: string,
    eventData?: Record<string, unknown>,
  ): Promise<void>;

  /**
   * Record an error
   */
  recordError(
    error: Error,
    context?: string,
    additionalData?: Record<string, unknown>,
  ): Promise<void>;

  /**
   * Check if the service is initialized
   */
  getIsInitialized(): boolean;
}
