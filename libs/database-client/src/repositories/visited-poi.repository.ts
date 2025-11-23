import { type Static } from "@sinclair/typebox";
import { type jsonSchemas } from "@vagabond/shared-utils";
import { and, eq } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { visitedPois } from "../schema.js";

export class VisitedPoiRepository {
  constructor(private readonly db: DrizzleClient) {}

  async createCustom(
    data: Static<typeof jsonSchemas.CreateVisitedPoiRequestSchema> & {
      userId: string;
      poiId: string;
    },
  ): Promise<unknown> {
    return await this.db.insert(visitedPois).values({
      poiId: data.poiId,
      userId: data.userId,
      imageKey: data.imageKey,
      rating: data.rating,
      comment: data.comment,
      coords: [data.coords.longitude, data.coords.latitude],
    });
  }

  async findByPoiAndUser(
    poiId: string,
    userId: string,
  ): Promise<{ id: number } | undefined> {
    return await this.db.query.visitedPois.findFirst({
      where: and(eq(visitedPois.poiId, poiId), eq(visitedPois.userId, userId)),
      columns: { id: true },
    });
  }
}
