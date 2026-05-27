import { getUserDisplayName } from "@vagabond/shared-utils";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { appReview, users } from "../schema.js";
import { mapWithIsoDate } from "../sqlMappers.js";

export interface DashboardAppReviewRow {
  id: number;
  positive: boolean;
  comment: string | null;
  createdAt: string;
  userId: string;
  userDisplayName: string;
}

interface OpaqueIntCursor {
  createdAt: string;
  id: number;
}

function encodeCursor(value: OpaqueIntCursor): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeCursor(raw: string): OpaqueIntCursor | null {
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
      typeof parsed.id === "number"
    ) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

interface ListAppReviewsParams {
  after: string | undefined;
  limit: number;
  positive: boolean | undefined;
}

interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

// Vue cross-org consommée par la route `/orgs/:slug/app-reviews`. Pas de
// filtre tenant — la garde d'accès est portée par `requireFeature("app-reviews")`
// au niveau route, pas par le scope géographique. Tri stable `(createdAt DESC,
// id DESC)` pour la pagination cursor.
export class DashboardAppReviewRepository {
  constructor(private readonly db: DrizzleClient) {}

  async listPaginated(
    params: ListAppReviewsParams,
  ): Promise<Paginated<DashboardAppReviewRow>> {
    const { after, limit, positive } = params;

    const cursor = after !== undefined ? decodeCursor(after) : null;
    const cursorDate = cursor !== null ? new Date(cursor.createdAt) : null;
    const cursorWhere =
      cursor !== null && cursorDate !== null
        ? or(
            lt(appReview.createdAt, cursorDate),
            and(
              eq(appReview.createdAt, cursorDate),
              lt(appReview.id, cursor.id),
            ),
          )
        : undefined;

    const positiveWhere =
      positive !== undefined ? eq(appReview.positive, positive) : undefined;

    const rows = await this.db
      .select({
        id: appReview.id,
        positive: appReview.positive,
        comment: appReview.comment,
        createdAt: sql`${appReview.createdAt}`.mapWith(mapWithIsoDate),
        userId: appReview.userId,
        fullName: users.fullName,
        email: users.email,
      })
      .from(appReview)
      .leftJoin(users, eq(appReview.userId, users.userId))
      .where(and(cursorWhere, positiveWhere))
      .orderBy(desc(appReview.createdAt), desc(appReview.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const itemsSlice = hasMore ? rows.slice(0, limit) : rows;
    const items: DashboardAppReviewRow[] = itemsSlice.map((row) => ({
      id: row.id,
      positive: row.positive,
      comment: row.comment,
      createdAt: row.createdAt,
      userId: row.userId,
      userDisplayName: getUserDisplayName(row.fullName, row.email),
    }));
    const last = itemsSlice[itemsSlice.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeCursor({ createdAt: last.createdAt, id: last.id })
        : null;

    return { items, nextCursor };
  }
}
