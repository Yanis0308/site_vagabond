import { getUserDisplayName, type ImageSource } from "@vagabond/shared-utils";
import { and, eq, sql } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { users, visitedPois } from "../schema.js";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Drizzle query builder return type is too complex to annotate manually
function buildBaseQuery(db: DrizzleClient) {
  return db
    .select({
      id: visitedPois.id,
      poiId: visitedPois.poiId,
      userId: visitedPois.userId,
      fullName: users.fullName,
      nickname: users.nickname,
      email: users.email,
      createdAt:
        sql`to_char(${visitedPois.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`.mapWith(
          String,
        ),
      comment: visitedPois.comment,
      imageKey: visitedPois.imageKey,
      imageSource: visitedPois.imageSource,
      rating: visitedPois.rating,
    })
    .from(visitedPois)
    .leftJoin(users, eq(visitedPois.userId, users.userId));
}

type BaseRow = Awaited<ReturnType<typeof buildBaseQuery>>[number];

export type VisitedPoiRow = Omit<BaseRow, "fullName" | "nickname" | "email"> & {
  username: string;
};

export class VisitedPoiRepository {
  constructor(private readonly db: DrizzleClient) {}

  private static formatRow(row: BaseRow): VisitedPoiRow {
    const { fullName, nickname, email, ...rest } = row;
    return {
      ...rest,
      username: nickname ?? getUserDisplayName(fullName, email),
    };
  }

  async createCustom(data: {
    imageKey?: string;
    imageSource: ImageSource;
    rating: number;
    comment: string;
    coords: { longitude: number; latitude: number };
    userId: string;
    poiId: string;
  }): Promise<{ id: number }> {
    const values = {
      poiId: data.poiId,
      userId: data.userId,
      ...(data.imageKey !== undefined && { imageKey: data.imageKey }),
      imageSource: data.imageSource,
      rating: data.rating,
      comment: data.comment,
      coords: sql`ST_SetSRID(ST_MakePoint(${data.coords.longitude}, ${data.coords.latitude}), 4326)`,
    };
    const result = await this.db
      .insert(visitedPois)
      .values(values)
      .returning({ id: visitedPois.id });

    const row = result[0];
    if (row === undefined) {
      throw new Error("Failed to create visited POI");
    }

    return { id: row.id };
  }

  async updateImageKey(id: number, imageKey: string): Promise<void> {
    await this.db
      .update(visitedPois)
      .set({ imageKey })
      .where(eq(visitedPois.id, id));
  }

  async findByIdAndUser(
    id: number,
    userId: string,
  ): Promise<{ id: number; imageKey: string | null } | undefined> {
    return await this.db.query.visitedPois.findFirst({
      where: and(eq(visitedPois.id, id), eq(visitedPois.userId, userId)),
      columns: { id: true, imageKey: true },
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

  async findByPoiId(poiId: string): Promise<VisitedPoiRow[]> {
    const result = await buildBaseQuery(this.db).where(
      eq(visitedPois.poiId, poiId),
    );
    return result.map((row) => VisitedPoiRepository.formatRow(row));
  }

  async findByUserId(userId: string): Promise<VisitedPoiRow[]> {
    const result = await buildBaseQuery(this.db).where(
      eq(visitedPois.userId, userId),
    );
    return result.map((row) => VisitedPoiRepository.formatRow(row));
  }

  async deleteByIdAndUser(
    id: number,
    userId: string,
  ): Promise<Array<{ id: number }>> {
    return await this.db
      .delete(visitedPois)
      .where(and(eq(visitedPois.id, id), eq(visitedPois.userId, userId)))
      .returning({ id: visitedPois.id });
  }
}
