import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  exists,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import {
  poiBoundaries,
  poiData,
  type PoiFilterLevelEnum,
  pois,
  users,
  visitedPois,
} from "../schema.js";
import { mapWithIsoDate, mapWithNullableIsoDate } from "../sqlMappers.js";
import { type BoundaryScope } from "./organization.repository.js";

export interface DashboardPoiRow {
  id: string;
  name: string | null;
  mainCategory: string | null;
  filterLevel: PoiFilterLevelEnum;
  disabled: boolean;
  createdAt: string;
}

export interface DashboardUserRow {
  id: string;
  displayName: string;
  email: string | null;
  visitedPoisCount: number;
  createdAt: string;
  lastVisitedPoiAt: string | null;
}

interface OpaqueCursor {
  createdAt: string;
  id: string;
}

// Cursor opaque — encodé base64url côté serveur, renvoyé tel quel par le client.
function encodeCursor(value: OpaqueCursor): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeCursor(raw: string): OpaqueCursor | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf-8"),
    );
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "createdAt" in parsed &&
      "id" in parsed &&
      typeof parsed.createdAt === "string" &&
      typeof parsed.id === "string"
    ) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

interface ListPoisParams {
  scope: BoundaryScope;
  after: string | undefined;
  limit: number;
  search: string | undefined;
  filterLevel: PoiFilterLevelEnum | undefined;
  disabled: boolean | undefined;
}

interface ListUsersParams {
  scope: BoundaryScope;
  after: string | undefined;
  limit: number;
  search: string | undefined;
}

interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

// Listings paginés pour le dashboard. Filtre toujours par scope (cf. ADR 0008) :
// `boundaries` => EXISTS sur poi_boundaries restreints à la liste autorisée.
// Tri stable par (createdAt DESC, id DESC) requis pour la pagination cursor.
export class DashboardListingsRepository {
  constructor(private readonly db: DrizzleClient) {}

  async listPois(params: ListPoisParams): Promise<Paginated<DashboardPoiRow>> {
    const { scope, after, limit, search, filterLevel, disabled } = params;

    if (scope.kind === "boundaries" && scope.boundaryIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    const cursor = after !== undefined ? decodeCursor(after) : null;
    const cursorDate = cursor !== null ? new Date(cursor.createdAt) : null;
    const cursorWhere =
      cursor !== null && cursorDate !== null
        ? or(
            lt(pois.createdAt, cursorDate),
            and(eq(pois.createdAt, cursorDate), lt(pois.id, cursor.id)),
          )
        : undefined;

    const scopeWhere =
      scope.kind === "boundaries"
        ? exists(
            this.db
              .select({ one: sql`1` })
              .from(poiBoundaries)
              .where(
                and(
                  eq(poiBoundaries.poiId, pois.id),
                  inArray(poiBoundaries.boundaryId, scope.boundaryIds),
                ),
              ),
          )
        : undefined;

    // NB : on référence la colonne outer en raw `pois.id` plutôt que via
    // `${pois.id}`. Drizzle ne qualifie pas avec le nom de table quand le FROM
    // n'a qu'une table — la sous-requête se retrouverait alors avec
    // `WHERE pd.poi_id = "id"` qui se résout sur `pd.id` (poi_data.id integer)
    // au lieu de `pois.id` (varchar) à cause des règles de scope SQL.
    const searchWhere =
      search !== undefined && search.length > 0
        ? sql`EXISTS (
            SELECT 1 FROM ${poiData} pd
            WHERE pd.poi_id = pois.id
              AND normalize_search_text(pd.name) LIKE '%' || normalize_search_text(${search}) || '%'
          )`
        : undefined;

    const filterLevelWhere =
      filterLevel !== undefined ? eq(pois.filterLevel, filterLevel) : undefined;

    const disabledWhere =
      disabled !== undefined ? eq(pois.disabled, disabled) : undefined;

    const rows = await this.db
      .select({
        id: pois.id,
        filterLevel: pois.filterLevel,
        disabled: pois.disabled,
        createdAt: sql`${pois.createdAt}`.mapWith(mapWithIsoDate),
        name: sql`(
          SELECT pd.name FROM ${poiData} pd
          WHERE pd.poi_id = pois.id
          ORDER BY pd.language DESC, pd.id
          LIMIT 1
        )`.mapWith((v: unknown): string | null =>
          typeof v === "string" ? v : null,
        ),
        mainCategory: sql`(
          SELECT pd.main_category FROM ${poiData} pd
          WHERE pd.poi_id = pois.id
          ORDER BY pd.language DESC, pd.id
          LIMIT 1
        )`.mapWith((v: unknown): string | null =>
          typeof v === "string" ? v : null,
        ),
      })
      .from(pois)
      .where(
        and(
          cursorWhere,
          scopeWhere,
          searchWhere,
          filterLevelWhere,
          disabledWhere,
        ),
      )
      .orderBy(desc(pois.createdAt), desc(pois.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const itemsSlice = hasMore ? rows.slice(0, limit) : rows;
    const last = itemsSlice[itemsSlice.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeCursor({ createdAt: last.createdAt, id: last.id })
        : null;

    return { items: itemsSlice, nextCursor };
  }

  async countPois(scope: BoundaryScope): Promise<number> {
    if (scope.kind === "boundaries" && scope.boundaryIds.length === 0) {
      return 0;
    }
    if (scope.kind === "global") {
      const [row] = await this.db.select({ value: count() }).from(pois);
      return row?.value ?? 0;
    }
    const [row] = await this.db
      .select({ value: countDistinct(pois.id) })
      .from(pois)
      .innerJoin(poiBoundaries, eq(poiBoundaries.poiId, pois.id))
      .where(inArray(poiBoundaries.boundaryId, scope.boundaryIds));
    return row?.value ?? 0;
  }

  async listUsers(
    params: ListUsersParams,
  ): Promise<Paginated<DashboardUserRow>> {
    const { scope, after, limit, search } = params;

    if (scope.kind === "boundaries" && scope.boundaryIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    const cursor = after !== undefined ? decodeCursor(after) : null;
    const cursorDate = cursor !== null ? new Date(cursor.createdAt) : null;
    const cursorWhere =
      cursor !== null && cursorDate !== null
        ? or(
            lt(users.createdAt, cursorDate),
            and(eq(users.createdAt, cursorDate), lt(users.userId, cursor.id)),
          )
        : undefined;

    const searchWhere =
      search !== undefined && search.length > 0
        ? sql`(
            normalize_search_text(${users.fullName}) LIKE '%' || normalize_search_text(${search}) || '%'
            OR normalize_search_text(${users.email}) LIKE '%' || normalize_search_text(${search}) || '%'
            OR normalize_search_text(${users.nickname}) LIKE '%' || normalize_search_text(${search}) || '%'
          )`
        : undefined;

    // Pour `boundaries` on restreint via EXISTS sur visited_pois rattachés à la
    // scope (seuls les users qui ont visité dans la zone apparaissent).
    const scopeExists =
      scope.kind === "boundaries"
        ? exists(
            this.db
              .select({ one: sql`1` })
              .from(visitedPois)
              .innerJoin(
                poiBoundaries,
                eq(poiBoundaries.poiId, visitedPois.poiId),
              )
              .where(
                and(
                  eq(visitedPois.userId, users.userId),
                  inArray(poiBoundaries.boundaryId, scope.boundaryIds),
                ),
              ),
          )
        : undefined;

    // Sous-requêtes scalaires pour agrégats : évite un GROUP BY qui rend la
    // pagination cursor instable.
    // NB : on référence la colonne outer en raw `users.user_id` plutôt que via
    // `${users.userId}`. Drizzle ne qualifie pas avec le nom de table quand le
    // FROM n'a qu'une table — la sous-requête se retrouverait alors avec
    // `WHERE vp.user_id = "user_id"` qui se résout sur `vp.user_id` (always
    // true) au lieu de `users.user_id` à cause des règles de scope SQL.
    // Idem pour l'`IN` sur boundary_id : on l'écrit en raw avec `sql.join` car
    // `inArray(poiBoundaries.boundaryId, …)` génère `"poi_boundaries"."boundary_id"`
    // qui ne matche pas l'alias `pb`.
    const boundaryIdsInList =
      scope.kind === "boundaries"
        ? sql.join(
            scope.boundaryIds.map((id) => sql`${id}`),
            sql`, `,
          )
        : sql``;
    const scopedBoundariesSql =
      scope.kind === "boundaries"
        ? sql`AND EXISTS (
            SELECT 1 FROM ${poiBoundaries} pb
            WHERE pb.poi_id = vp.poi_id
              AND pb.boundary_id IN (${boundaryIdsInList})
          )`
        : sql``;

    const visitedCountExpr = sql`(
      SELECT COUNT(*) FROM ${visitedPois} vp
      WHERE vp.user_id = users.user_id
      ${scopedBoundariesSql}
    )`.mapWith(Number);

    const lastVisitedExpr = sql`(
      SELECT MAX(vp.created_at)
      FROM ${visitedPois} vp
      WHERE vp.user_id = users.user_id
      ${scopedBoundariesSql}
    )`.mapWith(mapWithNullableIsoDate);

    const rows = await this.db
      .select({
        id: users.userId,
        fullName: users.fullName,
        nickname: users.nickname,
        email: users.email,
        createdAt: sql`${users.createdAt}`.mapWith(mapWithIsoDate),
        visitedPoisCount: visitedCountExpr,
        lastVisitedPoiAt: lastVisitedExpr,
      })
      .from(users)
      .where(and(cursorWhere, scopeExists, searchWhere))
      .orderBy(desc(users.createdAt), desc(users.userId))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const itemsSlice = hasMore ? rows.slice(0, limit) : rows;
    const items: DashboardUserRow[] = itemsSlice.map((row) => ({
      id: row.id,
      displayName: row.nickname ?? row.fullName ?? row.email ?? row.id,
      email: row.email,
      visitedPoisCount: row.visitedPoisCount,
      createdAt: row.createdAt,
      lastVisitedPoiAt: row.lastVisitedPoiAt,
    }));
    const last = itemsSlice[itemsSlice.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeCursor({ createdAt: last.createdAt, id: last.id })
        : null;

    return { items, nextCursor };
  }

  async countUsers(scope: BoundaryScope): Promise<number> {
    if (scope.kind === "boundaries" && scope.boundaryIds.length === 0) {
      return 0;
    }
    if (scope.kind === "global") {
      const [row] = await this.db.select({ value: count() }).from(users);
      return row?.value ?? 0;
    }
    const [row] = await this.db
      .select({ value: countDistinct(visitedPois.userId) })
      .from(visitedPois)
      .innerJoin(poiBoundaries, eq(poiBoundaries.poiId, visitedPois.poiId))
      .where(inArray(poiBoundaries.boundaryId, scope.boundaryIds));
    return row?.value ?? 0;
  }
}
