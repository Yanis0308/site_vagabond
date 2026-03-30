import {
  type CreateVisitedPoiRequest,
  getUserDisplayName,
} from "@vagabond/shared-utils";
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

  async createCustom(
    data: CreateVisitedPoiRequest & {
      userId: string;
      poiId: string;
    },
  ): Promise<unknown> {
    return await this.db.insert(visitedPois).values({
      poiId: data.poiId,
      userId: data.userId,
      imageKey: data.imageKey,
      imageSource: data.imageSource,
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
