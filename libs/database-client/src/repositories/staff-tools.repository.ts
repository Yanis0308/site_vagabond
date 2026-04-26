/**
 * Staff-tools repository: only "dangerous" operations live here — DELETEs and
 * unbounded/slow SELECTs that could harm the DB if called from regular flows.
 * Safe lookups (single-row, indexed) belong in the standard repositories.
 *
 * Access to this repository is gated by the no-restricted-syntax ESLint rule
 * on `*.staffTools.*`; see apps/api/eslint.config.mjs.
 */

import { and, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { type DrizzleClient } from "../drizzleClient.js";
import {
  boundaries,
  type BoundaryLevelEnum,
  poiBoundaries,
  visitedPois,
} from "../schema.js";

export class StaffToolsRepository {
  constructor(private readonly db: DrizzleClient) {}

  // Slow scan: returns every POI of an entire boundary (potentially thousands at REGION level).
  async findPoiIdsByBoundaryId(boundaryId: string): Promise<string[]> {
    const result = await this.db
      .selectDistinct({ poiId: poiBoundaries.poiId })
      .from(poiBoundaries)
      .where(eq(poiBoundaries.boundaryId, boundaryId));

    return result.map((r) => r.poiId);
  }

  // Slow self-join on poi_boundaries; only used for staff bulk completion's round-robin spread.
  async findPoiIdsByBoundaryGroupedBySubBoundary(
    boundaryId: string,
    subLevel: BoundaryLevelEnum,
  ): Promise<Array<{ subBoundaryId: string; poiIds: string[] }>> {
    const parentPb = alias(poiBoundaries, "parent_pb");
    const subPb = alias(poiBoundaries, "sub_pb");

    const rows = await this.db
      .selectDistinct({
        poiId: parentPb.poiId,
        subBoundaryId: subPb.boundaryId,
      })
      .from(parentPb)
      .innerJoin(subPb, eq(subPb.poiId, parentPb.poiId))
      .innerJoin(
        boundaries,
        and(
          eq(boundaries.id, subPb.boundaryId),
          eq(boundaries.boundaryLevel, subLevel),
        ),
      )
      .where(eq(parentPb.boundaryId, boundaryId));

    const grouped = new Map<string, string[]>();
    for (const row of rows) {
      const existing = grouped.get(row.subBoundaryId);
      if (existing !== undefined) {
        existing.push(row.poiId);
      } else {
        grouped.set(row.subBoundaryId, [row.poiId]);
      }
    }

    return Array.from(grouped.entries()).map(([subBoundaryId, poiIds]) => ({
      subBoundaryId,
      poiIds,
    }));
  }

  // Slow scan: WHERE IN clause can hold thousands of POI ids when filtering an entire region.
  async findValidationsForPoiIds(
    userId: string,
    poiIds: string[],
  ): Promise<Array<{ id: number; poiId: string; createdAt: Date }>> {
    if (poiIds.length === 0) return [];

    return await this.db
      .select({
        id: visitedPois.id,
        poiId: visitedPois.poiId,
        createdAt: visitedPois.createdAt,
      })
      .from(visitedPois)
      .where(
        and(eq(visitedPois.userId, userId), inArray(visitedPois.poiId, poiIds)),
      );
  }

  // Bulk DELETE — hard to undo, must remain dev-only.
  async deleteVisitedPoisByIds(ids: number[]): Promise<void> {
    if (ids.length === 0) return;

    await this.db.delete(visitedPois).where(inArray(visitedPois.id, ids));
  }
}
