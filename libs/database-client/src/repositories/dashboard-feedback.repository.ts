import {
  getUserDisplayName,
  type UserFeedbackCategory,
} from "@vagabond/shared-utils";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { userFeedbacks, users } from "../schema.js";
import { mapWithIsoDate } from "../sqlMappers.js";

export interface DashboardFeedbackRow {
  id: number;
  category: UserFeedbackCategory;
  message: string;
  targetPoiId: string | null;
  appVersion: string;
  os: string;
  createdAt: string;
  userId: string;
  userDisplayName: string;
  payload: unknown;
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

interface ListFeedbacksParams {
  after: string | undefined;
  limit: number;
  category: UserFeedbackCategory | undefined;
}

interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

// Vue cross-org consommée par la route `/orgs/:slug/feedbacks`. Pas de filtre
// tenant — la garde d'accès est portée par `requireFeature("feedbacks")` au
// niveau route, pas par le scope géographique. Tri stable `(createdAt DESC,
// id DESC)` pour la pagination cursor.
export class DashboardFeedbackRepository {
  constructor(private readonly db: DrizzleClient) {}

  async listPaginated(
    params: ListFeedbacksParams,
  ): Promise<Paginated<DashboardFeedbackRow>> {
    const { after, limit, category } = params;

    const cursor = after !== undefined ? decodeCursor(after) : null;
    const cursorDate = cursor !== null ? new Date(cursor.createdAt) : null;
    const cursorWhere =
      cursor !== null && cursorDate !== null
        ? or(
            lt(userFeedbacks.createdAt, cursorDate),
            and(
              eq(userFeedbacks.createdAt, cursorDate),
              lt(userFeedbacks.id, cursor.id),
            ),
          )
        : undefined;

    const categoryWhere =
      category !== undefined ? eq(userFeedbacks.category, category) : undefined;

    const rows = await this.db
      .select({
        id: userFeedbacks.id,
        category: userFeedbacks.category,
        message: userFeedbacks.message,
        targetPoiId: userFeedbacks.targetPoiId,
        appVersion: userFeedbacks.appVersion,
        os: userFeedbacks.os,
        createdAt: sql`${userFeedbacks.createdAt}`.mapWith(mapWithIsoDate),
        userId: userFeedbacks.userId,
        fullName: users.fullName,
        email: users.email,
        payload: userFeedbacks.payload,
      })
      .from(userFeedbacks)
      .leftJoin(users, eq(userFeedbacks.userId, users.userId))
      .where(and(cursorWhere, categoryWhere))
      .orderBy(desc(userFeedbacks.createdAt), desc(userFeedbacks.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const itemsSlice = hasMore ? rows.slice(0, limit) : rows;
    const items: DashboardFeedbackRow[] = itemsSlice.map((row) => ({
      id: row.id,
      category: row.category,
      message: row.message,
      targetPoiId: row.targetPoiId,
      appVersion: row.appVersion,
      os: row.os,
      createdAt: row.createdAt,
      userId: row.userId,
      userDisplayName: getUserDisplayName(row.fullName, row.email),
      payload: row.payload,
    }));
    const last = itemsSlice[itemsSlice.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeCursor({ createdAt: last.createdAt, id: last.id })
        : null;

    return { items, nextCursor };
  }
}
