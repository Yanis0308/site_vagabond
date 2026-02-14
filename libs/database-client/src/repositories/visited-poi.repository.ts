import { type jsonSchemas } from "@vagabond/shared-utils";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { type Static } from "typebox";

import { type DrizzleClient } from "../drizzleClient.js";
import { users, visitedPois } from "../schema.js";

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

  async findByPoiId(poiId: string): Promise<
    Array<{
      id: number;
      poiId: string;
      userId: string;
      username: string;
      createdAt: string;
      comment: string;
      imageKey: string;
      rating: number;
    }>
  > {
    const result = await this.db
      .select({
        id: visitedPois.id,
        poiId: visitedPois.poiId,
        userId: visitedPois.userId,
        username: sql`CASE 
          WHEN ${users.email} IS NOT NULL AND POSITION('@' IN ${users.email}) > 0 THEN 
            SUBSTRING(${users.email} FROM 1 FOR POSITION('@' IN ${users.email}) - 1)
          ELSE 'John Doe'
        END`.mapWith(String),
        createdAt:
          sql`to_char(${visitedPois.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`.mapWith(
            String,
          ),
        comment: visitedPois.comment,
        imageKey: visitedPois.imageKey,
        rating: visitedPois.rating,
      })
      .from(visitedPois)
      .leftJoin(users, eq(visitedPois.userId, users.userId))
      .where(eq(visitedPois.poiId, poiId));

    return result;
  }

  async findByUserId(userId: string): Promise<
    Array<{
      id: number;
      poiId: string;
      userId: string;
      username: string;
      createdAt: string;
      comment: string;
      imageKey: string;
      rating: number;
    }>
  > {
    const result = await this.db
      .select({
        id: visitedPois.id,
        poiId: visitedPois.poiId,
        userId: visitedPois.userId,
        username: sql`CASE 
          WHEN ${users.email} IS NOT NULL AND POSITION('@' IN ${users.email}) > 0 THEN 
            SUBSTRING(${users.email} FROM 1 FOR POSITION('@' IN ${users.email}) - 1)
          ELSE 'John Doe'
        END`.mapWith(String),
        createdAt:
          sql`to_char(${visitedPois.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`.mapWith(
            String,
          ),
        comment: visitedPois.comment,
        imageKey: visitedPois.imageKey,
        rating: visitedPois.rating,
      })
      .from(visitedPois)
      .leftJoin(users, eq(visitedPois.userId, users.userId))
      .where(eq(visitedPois.userId, userId));

    return result;
  }
}
