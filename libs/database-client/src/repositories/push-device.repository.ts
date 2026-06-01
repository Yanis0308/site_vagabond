import { and, eq, isNull } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { pushDevices } from "../schema.js";

export type PushDevicePlatform = "ios" | "android";

export interface PushDeviceUpsertInput {
  userId: string;
  token: string;
  platform: PushDevicePlatform;
  appVersion: string;
  osVersion: string;
  deviceModel: string | null;
}

export interface ActivePushDevice {
  id: number;
  token: string;
  platform: PushDevicePlatform;
}

export class PushDeviceRepository {
  constructor(private readonly db: DrizzleClient) {}

  async upsertByToken(input: PushDeviceUpsertInput): Promise<{ id: number }> {
    const now = new Date();
    const [row] = await this.db
      .insert(pushDevices)
      .values({
        userId: input.userId,
        token: input.token,
        platform: input.platform,
        appVersion: input.appVersion,
        osVersion: input.osVersion,
        deviceModel: input.deviceModel,
        lastSeenAt: now,
      })
      .onConflictDoUpdate({
        target: pushDevices.token,
        set: {
          userId: input.userId,
          platform: input.platform,
          appVersion: input.appVersion,
          osVersion: input.osVersion,
          deviceModel: input.deviceModel,
          lastSeenAt: now,
          updatedAt: now,
          disabledAt: null,
        },
      })
      .returning({ id: pushDevices.id });

    if (row === undefined) {
      throw new Error("Failed to upsert push device");
    }

    return { id: row.id };
  }

  async deleteByToken(userId: string, token: string): Promise<void> {
    await this.db
      .delete(pushDevices)
      .where(and(eq(pushDevices.userId, userId), eq(pushDevices.token, token)));
  }

  /**
   * Lists all active push devices for a user (i.e. `disabled_at IS NULL`).
   * Used by the notification sender to fan out a notification to every device
   * a user is currently signed in on.
   */
  async listActiveByUser(userId: string): Promise<ActivePushDevice[]> {
    const rows = await this.db
      .select({
        id: pushDevices.id,
        token: pushDevices.token,
        platform: pushDevices.platform,
      })
      .from(pushDevices)
      .where(
        and(eq(pushDevices.userId, userId), isNull(pushDevices.disabledAt)),
      );

    return rows.map((row) => ({
      id: row.id,
      token: row.token,
      platform: row.platform as PushDevicePlatform,
    }));
  }

  /**
   * Marks a token as disabled (e.g. after FCM returns `registration-token-not-registered`).
   * Idempotent: only writes when `disabled_at` is still NULL.
   */
  async markDisabledByToken(
    token: string,
    now: Date = new Date(),
  ): Promise<void> {
    await this.db
      .update(pushDevices)
      .set({ disabledAt: now })
      .where(and(eq(pushDevices.token, token), isNull(pushDevices.disabledAt)));
  }
}
