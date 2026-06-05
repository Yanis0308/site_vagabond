import {
  type NotificationChannelId,
  type NotificationPriority,
  type NotificationTemplateKey,
  type NotificationTriggerSource,
} from "@vagabond/shared-utils";
import { and, count, desc, eq, gte, ne, sql } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { notificationEvents } from "../schema.js";

export type NotificationEventStatus = "sent" | "opened" | "failed";

export interface NotificationEventInsertInput {
  notificationId: string;
  userId: string;
  templateKey: NotificationTemplateKey;
  channelId: NotificationChannelId;
  priority: NotificationPriority;
  titleRendered: string;
  bodyRendered: string;
  variantIndex: number;
  deepLink: string;
  status: Extract<NotificationEventStatus, "sent" | "failed">;
  failureReason: string | null;
  sentAt: Date;
  triggerSource: NotificationTriggerSource;
  triggerCoords: { latitude: number; longitude: number } | null;
}

export class NotificationEventRepository {
  constructor(private readonly db: DrizzleClient) {}

  async insert(input: NotificationEventInsertInput): Promise<void> {
    await this.db.insert(notificationEvents).values({
      notificationId: input.notificationId,
      userId: input.userId,
      templateKey: input.templateKey,
      channelId: input.channelId,
      priority: input.priority,
      titleRendered: input.titleRendered,
      bodyRendered: input.bodyRendered,
      variantIndex: input.variantIndex,
      deepLink: input.deepLink,
      status: input.status,
      failureReason: input.failureReason,
      sentAt: input.sentAt,
      triggerSource: input.triggerSource,
      triggerCoords:
        input.triggerCoords !== null
          ? sql`ST_SetSRID(ST_MakePoint(${input.triggerCoords.longitude}, ${input.triggerCoords.latitude}), 4326)`
          : null,
    });
  }

  /**
   * Set status='opened' and openedAt=now() for a given (userId, notificationId).
   * Idempotent: only writes when openedAt is still NULL.
   */
  async markOpened(
    userId: string,
    notificationId: string,
    now: Date = new Date(),
  ): Promise<void> {
    await this.db
      .update(notificationEvents)
      .set({ status: "opened", openedAt: now })
      .where(
        and(
          eq(notificationEvents.userId, userId),
          eq(notificationEvents.notificationId, notificationId),
          sql`${notificationEvents.openedAt} IS NULL`,
        ),
      );
  }

  /**
   * Count notification events for a user since a given timestamp.
   * Excludes failed events (they shouldn't count against caps).
   */
  async countSinceForUser(userId: string, since: Date): Promise<number> {
    const [row] = await this.db
      .select({ value: count().mapWith(Number) })
      .from(notificationEvents)
      .where(
        and(
          eq(notificationEvents.userId, userId),
          gte(notificationEvents.sentAt, since),
          ne(notificationEvents.status, "failed"),
        ),
      );
    return row?.value ?? 0;
  }

  /**
   * Latest sentAt for a user across any template (excluding failed events).
   * Used for the MIN_HOURS_BETWEEN_PUSH anti-spam filter.
   */
  async getLastSentAtForUser(userId: string): Promise<Date | null> {
    const [row] = await this.db
      .select({ sentAt: notificationEvents.sentAt })
      .from(notificationEvents)
      .where(
        and(
          eq(notificationEvents.userId, userId),
          ne(notificationEvents.status, "failed"),
        ),
      )
      .orderBy(desc(notificationEvents.sentAt))
      .limit(1);
    return row?.sentAt ?? null;
  }

  /**
   * Latest sentAt for a (user, template) pair (excluding failed events).
   * Used for the per-template cooldown filter.
   */
  async getLastSentAtForTemplate(
    userId: string,
    templateKey: NotificationTemplateKey,
  ): Promise<Date | null> {
    const [row] = await this.db
      .select({ sentAt: notificationEvents.sentAt })
      .from(notificationEvents)
      .where(
        and(
          eq(notificationEvents.userId, userId),
          eq(notificationEvents.templateKey, templateKey),
          ne(notificationEvents.status, "failed"),
        ),
      )
      .orderBy(desc(notificationEvents.sentAt))
      .limit(1);
    return row?.sentAt ?? null;
  }

  /**
   * Count all events ever sent for a (user, template) pair, including failed
   * ones. Used to derive the variant index for deterministic round-robin
   * rotation across re-sends.
   */
  async countSentForTemplate(
    userId: string,
    templateKey: NotificationTemplateKey,
  ): Promise<number> {
    const [row] = await this.db
      .select({ value: count().mapWith(Number) })
      .from(notificationEvents)
      .where(
        and(
          eq(notificationEvents.userId, userId),
          eq(notificationEvents.templateKey, templateKey),
        ),
      );
    return row?.value ?? 0;
  }
}
