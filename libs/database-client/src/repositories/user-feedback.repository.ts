import { sql } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { userFeedbacks } from "../schema.js";
import { type UserFeedbackCreateInput } from "../types.js";

export class UserFeedbackRepository {
  constructor(private readonly db: DrizzleClient) {}

  async create(
    data: UserFeedbackCreateInput & {
      userId: string;
    },
  ): Promise<{ id: number }> {
    const [userFeedback] = await this.db
      .insert(userFeedbacks)
      .values({
        userId: data.userId,
        category: data.category,
        message: data.message,
        targetPoiId: data.targetPoiId ?? null,
        location:
          data.location === undefined
            ? null
            : sql`ST_SetSRID(ST_MakePoint(${data.location.longitude}, ${data.location.latitude}), 4326)`,
        city: data.city ?? null,
        payload: data.payload,
        appVersion: data.appVersion,
        os: data.os,
      })
      .returning({ id: userFeedbacks.id });

    if (userFeedback === undefined) {
      throw new Error("Failed to create user feedback");
    }

    return { id: userFeedback.id };
  }
}
