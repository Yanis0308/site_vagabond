import { and, between, eq, inArray, sql } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import {
  appReview,
  poiBoundaries,
  pois,
  userFeedbacks,
  users,
  visitedPois,
} from "../schema.js";
import { type BoundaryScope } from "./organization.repository.js";

export interface DashboardStatsCounters {
  pois: number;
  mobileUsers: number;
  visitedPois: number;
  userFeedbacks: number;
}

export interface DashboardStatsTimeseriesPoint {
  date: string;
  visitedPois: number;
  userFeedbacks: number;
  appReviewsPositive: number;
  appReviewsNegative: number;
  newMobileUsers: number;
}

export interface DashboardStats {
  counters: DashboardStatsCounters;
  timeseries: DashboardStatsTimeseriesPoint[];
}

interface StatsParams {
  scope: BoundaryScope;
  from: Date;
  to: Date;
}

// Convention V0 (cf. ADR 0008) :
//   - `pois` / `mobileUsers` = compteurs **cumulés** (pas filtrés par la fenêtre).
//   - `visitedPois` / `userFeedbacks` = comptés sur la fenêtre `[from, to]`.
//   - `appReviews*` et `newMobileUsers` : pas attribuables géographiquement →
//     toujours 0 pour les orgs `BOUNDARIES` (acceptable V0, à raffiner ensuite
//     si besoin). Pour les orgs `ALL` (staff) : count global.
export class StatsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getDashboardStats(params: StatsParams): Promise<DashboardStats> {
    const { scope, from, to } = params;

    const [counters, timeseries] = await Promise.all([
      this.loadCounters(scope, from, to),
      this.loadTimeseries(scope, from, to),
    ]);

    return { counters, timeseries };
  }

  private async loadCounters(
    scope: BoundaryScope,
    from: Date,
    to: Date,
  ): Promise<DashboardStatsCounters> {
    if (scope.kind === "global") {
      const [
        [poisRow],
        [mobileUsersRow],
        [visitedPoisRow],
        [userFeedbacksRow],
      ] = await Promise.all([
        this.db.select({ count: sql`count(*)`.mapWith(Number) }).from(pois),
        this.db.select({ count: sql`count(*)`.mapWith(Number) }).from(users),
        this.db
          .select({ count: sql`count(*)`.mapWith(Number) })
          .from(visitedPois)
          .where(between(visitedPois.createdAt, from, to)),
        this.db
          .select({ count: sql`count(*)`.mapWith(Number) })
          .from(userFeedbacks)
          .where(between(userFeedbacks.createdAt, from, to)),
      ]);

      return {
        pois: poisRow?.count ?? 0,
        mobileUsers: mobileUsersRow?.count ?? 0,
        visitedPois: visitedPoisRow?.count ?? 0,
        userFeedbacks: userFeedbacksRow?.count ?? 0,
      };
    }

    // scope.kind === "boundaries"
    if (scope.boundaryIds.length === 0) {
      return { pois: 0, mobileUsers: 0, visitedPois: 0, userFeedbacks: 0 };
    }
    const boundaryIds = scope.boundaryIds;

    const [[poisRow], [mobileUsersRow], [visitedPoisRow], [userFeedbacksRow]] =
      await Promise.all([
        this.db
          .select({
            count: sql`count(distinct ${pois.id})`.mapWith(Number),
          })
          .from(pois)
          .innerJoin(poiBoundaries, eq(poiBoundaries.poiId, pois.id))
          .where(inArray(poiBoundaries.boundaryId, boundaryIds)),
        this.db
          .select({
            count: sql`count(distinct ${visitedPois.userId})`.mapWith(Number),
          })
          .from(visitedPois)
          .innerJoin(poiBoundaries, eq(poiBoundaries.poiId, visitedPois.poiId))
          .where(inArray(poiBoundaries.boundaryId, boundaryIds)),
        this.db
          .select({ count: sql`count(*)`.mapWith(Number) })
          .from(visitedPois)
          .innerJoin(poiBoundaries, eq(poiBoundaries.poiId, visitedPois.poiId))
          .where(
            and(
              inArray(poiBoundaries.boundaryId, boundaryIds),
              between(visitedPois.createdAt, from, to),
            ),
          ),
        this.db
          .select({ count: sql`count(*)`.mapWith(Number) })
          .from(userFeedbacks)
          .innerJoin(
            poiBoundaries,
            eq(poiBoundaries.poiId, userFeedbacks.targetPoiId),
          )
          .where(
            and(
              inArray(poiBoundaries.boundaryId, boundaryIds),
              between(userFeedbacks.createdAt, from, to),
            ),
          ),
      ]);

    return {
      pois: poisRow?.count ?? 0,
      mobileUsers: mobileUsersRow?.count ?? 0,
      visitedPois: visitedPoisRow?.count ?? 0,
      userFeedbacks: userFeedbacksRow?.count ?? 0,
    };
  }

  private async loadTimeseries(
    scope: BoundaryScope,
    from: Date,
    to: Date,
  ): Promise<DashboardStatsTimeseriesPoint[]> {
    const isGlobal = scope.kind === "global";
    const boundaryIds =
      scope.kind === "boundaries" ? scope.boundaryIds : ([] as string[]);

    // Si scope BOUNDARIES sans aucune boundary attachée, tous les comptes sont 0.
    if (!isGlobal && boundaryIds.length === 0) {
      return buildEmptyDayGrid(from, to);
    }

    // Grouping calendaire par jour pour la timeseries. Les colonnes
    // `created_at` sont en `timestamptz` (UTC absolu en DB) ; le `at time zone
    // 'UTC'` explicite force `to_char` à formatter en UTC plutôt que selon la
    // TZ de session Postgres — sinon le découpage `YYYY-MM-DD` dépendrait de
    // la config serveur (instable, fuseaux décalés autour de minuit).
    const dayExpr =
      sql`to_char(${visitedPois.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`.mapWith(
        String,
      );
    const userFeedbackDay =
      sql`to_char(${userFeedbacks.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`.mapWith(
        String,
      );
    const appReviewDay =
      sql`to_char(${appReview.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`.mapWith(
        String,
      );
    const newUserDay =
      sql`to_char(${users.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`.mapWith(
        String,
      );

    const visitedPoisQuery = isGlobal
      ? this.db
          .select({ day: dayExpr, count: sql`count(*)`.mapWith(Number) })
          .from(visitedPois)
          .where(between(visitedPois.createdAt, from, to))
          .groupBy(dayExpr)
      : this.db
          .select({ day: dayExpr, count: sql`count(*)`.mapWith(Number) })
          .from(visitedPois)
          .innerJoin(poiBoundaries, eq(poiBoundaries.poiId, visitedPois.poiId))
          .where(
            and(
              between(visitedPois.createdAt, from, to),
              inArray(poiBoundaries.boundaryId, boundaryIds),
            ),
          )
          .groupBy(dayExpr);

    const userFeedbacksQuery = isGlobal
      ? this.db
          .select({
            day: userFeedbackDay,
            count: sql`count(*)`.mapWith(Number),
          })
          .from(userFeedbacks)
          .where(between(userFeedbacks.createdAt, from, to))
          .groupBy(userFeedbackDay)
      : this.db
          .select({
            day: userFeedbackDay,
            count: sql`count(*)`.mapWith(Number),
          })
          .from(userFeedbacks)
          .innerJoin(
            poiBoundaries,
            eq(poiBoundaries.poiId, userFeedbacks.targetPoiId),
          )
          .where(
            and(
              between(userFeedbacks.createdAt, from, to),
              inArray(poiBoundaries.boundaryId, boundaryIds),
            ),
          )
          .groupBy(userFeedbackDay);

    // Métriques non-géolocalisables : nulles hors `global` (cf. commentaire en
    // tête de classe).
    const appReviewsPositiveQuery = isGlobal
      ? this.db
          .select({ day: appReviewDay, count: sql`count(*)`.mapWith(Number) })
          .from(appReview)
          .where(
            and(
              eq(appReview.positive, true),
              between(appReview.createdAt, from, to),
            ),
          )
          .groupBy(appReviewDay)
      : Promise.resolve([]);

    const appReviewsNegativeQuery = isGlobal
      ? this.db
          .select({ day: appReviewDay, count: sql`count(*)`.mapWith(Number) })
          .from(appReview)
          .where(
            and(
              eq(appReview.positive, false),
              between(appReview.createdAt, from, to),
            ),
          )
          .groupBy(appReviewDay)
      : Promise.resolve([]);

    const newUsersQuery = isGlobal
      ? this.db
          .select({ day: newUserDay, count: sql`count(*)`.mapWith(Number) })
          .from(users)
          .where(between(users.createdAt, from, to))
          .groupBy(newUserDay)
      : Promise.resolve([]);

    const [
      visitedPoisRows,
      userFeedbacksRows,
      appReviewsPositiveRows,
      appReviewsNegativeRows,
      newUsersRows,
    ] = await Promise.all([
      visitedPoisQuery,
      userFeedbacksQuery,
      appReviewsPositiveQuery,
      appReviewsNegativeQuery,
      newUsersQuery,
    ]);

    const visitedPoisByDay = toMap(visitedPoisRows);
    const userFeedbacksByDay = toMap(userFeedbacksRows);
    const appReviewsPositiveByDay = toMap(appReviewsPositiveRows);
    const appReviewsNegativeByDay = toMap(appReviewsNegativeRows);
    const newUsersByDay = toMap(newUsersRows);

    return buildEmptyDayGrid(from, to).map((point) => ({
      date: point.date,
      visitedPois: visitedPoisByDay.get(point.date) ?? 0,
      userFeedbacks: userFeedbacksByDay.get(point.date) ?? 0,
      appReviewsPositive: appReviewsPositiveByDay.get(point.date) ?? 0,
      appReviewsNegative: appReviewsNegativeByDay.get(point.date) ?? 0,
      newMobileUsers: newUsersByDay.get(point.date) ?? 0,
    }));
  }
}

function toMap(
  rows: Array<{ day: string; count: number }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.day, row.count);
  }
  return map;
}

function buildEmptyDayGrid(
  from: Date,
  to: Date,
): DashboardStatsTimeseriesPoint[] {
  const points: DashboardStatsTimeseriesPoint[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  while (cursor.getTime() <= end) {
    points.push({
      date: cursor.toISOString().slice(0, 10),
      visitedPois: 0,
      userFeedbacks: 0,
      appReviewsPositive: 0,
      appReviewsNegative: 0,
      newMobileUsers: 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}
