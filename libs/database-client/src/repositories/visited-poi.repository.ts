import {
  type CreateVisitedPoiRequest,
  getUserDisplayName,
} from "@vagabond/shared-utils";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import {
  type PeriodType,
  poiBoundaries,
  poiData,
  pois,
  userLocations,
  userPeriodScores,
  users,
  visitedPois,
} from "../schema.js";
import { mapWithIsoDate } from "../sqlMappers.js";

interface VisitedPoiCursor {
  createdAt: string;
  id: number;
}

// Cursor opaque - seul le serveur le manipule, le client le renvoie tel quel
function encodeVisitedPoiCursor(c: VisitedPoiCursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

function decodeVisitedPoiCursor(s: string): VisitedPoiCursor | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(s, "base64url").toString("utf-8"),
    );
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "createdAt" in parsed &&
      "id" in parsed &&
      typeof parsed.createdAt === "string" &&
      typeof parsed.id === "number"
    ) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

// Périodes actives pour un timestamp donné. Étendre ici pour ajouter weekly/yearly/…
// (cf. ADR-0002 : pas de migration de schema requise, seul ce helper change).
function computeActivePeriods(
  at: Date,
): Array<{ type: PeriodType; key: string }> {
  const year = at.getUTCFullYear();
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  return [
    { type: "all_time", key: "" },
    { type: "monthly", key: `${year}-${month}` },
  ];
}

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
      createdAt: sql`${visitedPois.createdAt}`.mapWith(mapWithIsoDate),
      comment: visitedPois.comment,
      imageKey: visitedPois.imageKey,
      imageSource: visitedPois.imageSource,
      rating: visitedPois.rating,
      // on ne gère qu'une seule langue, donc max 1 row par poi_id (pas de risque de duplication).
      name: poiData.name,
      longitude: sql`ST_X(${pois.coords}::geometry)`.mapWith(Number),
      latitude: sql`ST_Y(${pois.coords}::geometry)`.mapWith(Number),
      disabled: pois.disabled,
    })
    .from(visitedPois)
    .leftJoin(users, eq(visitedPois.userId, users.userId))
    .innerJoin(pois, eq(pois.id, visitedPois.poiId))
    .leftJoin(poiData, eq(poiData.poiId, visitedPois.poiId));
}

type BaseRow = Awaited<ReturnType<typeof buildBaseQuery>>[number];

export type VisitedPoiRow = Omit<
  BaseRow,
  | "fullName"
  | "nickname"
  | "email"
  | "name"
  | "longitude"
  | "latitude"
  | "disabled"
> & {
  username: string;
  name?: string;
  coords: { latitude: number; longitude: number };
  isDisabled: boolean;
};

export interface VisitedPoiContext {
  id: number;
  poiId: string;
  imageKey: string | null;
  rating: number;
  comment: string;
  createdAt: Date;
}

export class VisitedPoiRepository {
  constructor(private readonly db: DrizzleClient) {}

  private static formatRow(row: BaseRow): VisitedPoiRow {
    const {
      fullName,
      nickname,
      email,
      name,
      longitude,
      latitude,
      disabled,
      ...rest
    } = row;
    return {
      ...rest,
      username: nickname ?? getUserDisplayName(fullName, email),
      ...(name !== null ? { name } : {}),
      coords: { latitude, longitude },
      isDisabled: disabled,
    };
  }

  async createCustom(
    data: CreateVisitedPoiRequest & {
      userId: string;
      poiId: string;
    },
  ): Promise<{ id: number }> {
    return await this.db.transaction(async (tx) => {
      const [location] = await tx
        .insert(userLocations)
        .values({
          userId: data.userId,
          coords: sql`ST_SetSRID(ST_MakePoint(${data.coords.longitude}, ${data.coords.latitude}), 4326)`,
          accuracy: data.coords.accuracy,
          altitude: data.coords.altitude,
          altitudeAccuracy: data.coords.altitudeAccuracy,
          heading: data.coords.heading,
          speed: data.coords.speed,
          timestamp: new Date(),
        })
        .returning({ id: userLocations.id });

      if (location === undefined) {
        throw new Error("Failed to create user location");
      }

      const [visitedPoi] = await tx
        .insert(visitedPois)
        .values({
          poiId: data.poiId,
          userId: data.userId,
          locationId: location.id,
          ...(data.imageKey !== undefined && { imageKey: data.imageKey }),
          imageSource: data.imageSource,
          rating: data.rating,
          comment: data.comment,
        })
        .returning({
          id: visitedPois.id,
          createdAt: visitedPois.createdAt,
        });

      if (visitedPoi === undefined) {
        throw new Error("Failed to create visited POI");
      }

      // Maintien des compteurs dénormalisés (cf. ADR-0002).
      // Une ligne UPSERT par période active. Atomique avec l'INSERT ci-dessus.
      for (const period of computeActivePeriods(visitedPoi.createdAt)) {
        await tx
          .insert(userPeriodScores)
          .values({
            userId: data.userId,
            periodType: period.type,
            periodKey: period.key,
            count: 1,
          })
          .onConflictDoUpdate({
            target: [
              userPeriodScores.userId,
              userPeriodScores.periodType,
              userPeriodScores.periodKey,
            ],
            set: {
              count: sql`${userPeriodScores.count} + 1`,
              updatedAt: sql`now()`,
            },
          });
      }

      // Même raisonnement que ci-dessus : pas de trigger PG, logique applicative.
      await tx
        .update(pois)
        .set({ visitCount: sql`${pois.visitCount} + 1` })
        .where(eq(pois.id, data.poiId));

      return { id: visitedPoi.id };
    });
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

  async findContextByIdAndUser(
    id: number,
    userId: string,
  ): Promise<VisitedPoiContext | undefined> {
    return await this.db.query.visitedPois.findFirst({
      where: and(eq(visitedPois.id, id), eq(visitedPois.userId, userId)),
      columns: {
        id: true,
        poiId: true,
        imageKey: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
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

  // Cursor pagination : ORDER BY created_at DESC, id DESC + WHERE user_id = ?
  // Optionnel : filtre par boundaryId (sert le profil hiérarchique lazy-load).
  async findByUserIdPaginated({
    userId,
    after,
    limit,
    boundaryId,
  }: {
    userId: string;
    after: string | undefined;
    limit: number;
    boundaryId: string | undefined;
  }): Promise<{ items: VisitedPoiRow[]; nextCursor: string | null }> {
    const cursor = after !== undefined ? decodeVisitedPoiCursor(after) : null;
    const cursorDate = cursor !== null ? new Date(cursor.createdAt) : null;
    const cursorWhere =
      cursor !== null && cursorDate !== null
        ? or(
            lt(visitedPois.createdAt, cursorDate),
            and(
              eq(visitedPois.createdAt, cursorDate),
              lt(visitedPois.id, cursor.id),
            ),
          )
        : undefined;

    const whereBoundary =
      boundaryId !== undefined
        ? sql`EXISTS (
            SELECT 1 FROM ${poiBoundaries}
            WHERE ${poiBoundaries.poiId} = ${visitedPois.poiId}
              AND ${poiBoundaries.boundaryId} = ${boundaryId}
          )`
        : undefined;

    const rows = await buildBaseQuery(this.db)
      .where(and(eq(visitedPois.userId, userId), cursorWhere, whereBoundary))
      .orderBy(desc(visitedPois.createdAt), desc(visitedPois.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const itemsSlice = hasMore ? rows.slice(0, limit) : rows;
    const items = itemsSlice.map((row) => VisitedPoiRepository.formatRow(row));
    const last = itemsSlice[itemsSlice.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeVisitedPoiCursor({
            createdAt: last.createdAt,
            id: last.id,
          })
        : null;

    return { items, nextCursor };
  }

  async findByPoiIdPaginated({
    poiId,
    after,
    limit,
  }: {
    poiId: string;
    after: string | undefined;
    limit: number;
  }): Promise<{ items: VisitedPoiRow[]; nextCursor: string | null }> {
    const cursor = after !== undefined ? decodeVisitedPoiCursor(after) : null;
    const cursorDate = cursor !== null ? new Date(cursor.createdAt) : null;
    const cursorWhere =
      cursor !== null && cursorDate !== null
        ? or(
            lt(visitedPois.createdAt, cursorDate),
            and(
              eq(visitedPois.createdAt, cursorDate),
              lt(visitedPois.id, cursor.id),
            ),
          )
        : undefined;

    const rows = await buildBaseQuery(this.db)
      .where(and(eq(visitedPois.poiId, poiId), cursorWhere))
      .orderBy(desc(visitedPois.createdAt), desc(visitedPois.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const itemsSlice = hasMore ? rows.slice(0, limit) : rows;
    const items = itemsSlice.map((row) => VisitedPoiRepository.formatRow(row));
    const last = itemsSlice[itemsSlice.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeVisitedPoiCursor({
            createdAt: last.createdAt,
            id: last.id,
          })
        : null;

    return { items, nextCursor };
  }

  async deleteByIdAndUser(
    id: number,
    userId: string,
  ): Promise<Array<{ id: number }>> {
    return await this.db.transaction(async (tx) => {
      const deleted = await tx
        .delete(visitedPois)
        .where(and(eq(visitedPois.id, id), eq(visitedPois.userId, userId)))
        .returning({
          id: visitedPois.id,
          poiId: visitedPois.poiId,
          createdAt: visitedPois.createdAt,
        });

      if (deleted.length === 0) {
        return [];
      }

      // Décrément des compteurs maintenus par createCustom.
      // GREATEST(0, …) protège d'un éventuel drift négatif (filet de sécurité).
      for (const row of deleted) {
        for (const period of computeActivePeriods(row.createdAt)) {
          await tx
            .update(userPeriodScores)
            .set({
              count: sql`GREATEST(0, ${userPeriodScores.count} - 1)`,
            })
            .where(
              and(
                eq(userPeriodScores.userId, userId),
                eq(userPeriodScores.periodType, period.type),
                eq(userPeriodScores.periodKey, period.key),
              ),
            );
        }

        await tx
          .update(pois)
          .set({ visitCount: sql`GREATEST(0, ${pois.visitCount} - 1)` })
          .where(eq(pois.id, row.poiId));
      }

      return deleted.map(({ id: deletedId }) => ({ id: deletedId }));
    });
  }
}
