import { and, eq } from "drizzle-orm";

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
}
