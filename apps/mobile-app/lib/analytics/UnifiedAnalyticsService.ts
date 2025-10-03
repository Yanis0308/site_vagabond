import { CrashlyticsService } from "./CrashlyticsService";
import { FirebaseAnalyticsService } from "./FirebaseAnalyticsService";
import type {
  AnalyticsAppContext,
  AnalyticsUserContext,
  IAnalyticsService,
} from "./types";
import { VexoService } from "./VexoService";

export class UnifiedAnalyticsService implements IAnalyticsService {
  private static instance: UnifiedAnalyticsService | null = null;

  public static getInstance(): UnifiedAnalyticsService {
    UnifiedAnalyticsService.instance ??= new UnifiedAnalyticsService();
    return UnifiedAnalyticsService.instance;
  }

  private isInitialized = false;

  // All three analytics services
  private services: IAnalyticsService[];
  private crashlyticsService: CrashlyticsService;
  private firebaseAnalyticsService: FirebaseAnalyticsService;
  private vexoService: VexoService;

  constructor() {
    this.crashlyticsService = new CrashlyticsService();
    this.firebaseAnalyticsService = new FirebaseAnalyticsService();
    this.vexoService = new VexoService();

    // Array of all services for easy iteration
    this.services = [
      this.crashlyticsService,
      this.firebaseAnalyticsService,
      this.vexoService,
    ];
  }

  async initialize(): Promise<void> {
    try {
      // Initialize all services in parallel
      await Promise.allSettled([
        this.crashlyticsService.initialize(),
        this.firebaseAnalyticsService.initialize(),
        this.vexoService.initialize(),
      ]);

      this.isInitialized = true;
    } catch (error) {
      await this.crashlyticsService.recordError(
        new Error(`Unified Analytics initialization failed: ${String(error)}`),
      );
    }
  }

  async setUserContext(userContext: AnalyticsUserContext): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Set user context on all services in parallel
      await Promise.allSettled(
        this.services.map((service) => service.setUserContext(userContext)),
      );
    } catch (error) {
      await this.crashlyticsService.recordError(
        new Error(`Failed to set unified user context: ${String(error)}`),
      );
    }
  }

  async clearUserContext(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Clear user context on all services in parallel
      await Promise.allSettled(
        this.services.map((service) => service.clearUserContext()),
      );
    } catch (error) {
      await this.crashlyticsService.recordError(
        new Error(`Failed to clear unified user context: ${String(error)}`),
      );
    }
  }

  async setAttributes(attributes: Record<string, string>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Set attributes on all services in parallel
      await Promise.allSettled(
        this.services.map((service) => service.setAttributes(attributes)),
      );
    } catch (error) {
      await this.crashlyticsService.recordError(
        new Error(`Failed to set unified attributes: ${String(error)}`),
      );
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

    // Log to all services in parallel
    await Promise.allSettled(
      this.services.map((service) =>
        service.logCustomEvent(eventName, eventData),
      ),
    );
  }

  async recordError(
    error: Error,
    context?: string,
    additionalData?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.isInitialized) return;

    // Record error on all services in parallel
    await Promise.allSettled(
      this.services.map((service) =>
        service.recordError(error, context, additionalData),
      ),
    );
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}
