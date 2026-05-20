import { getUserDisplayName, logger } from "@vagabond/shared-utils";
import {
  and,
  asc,
  countDistinct,
  desc,
  eq,
  exists,
  gt,
  gte,
  max,
  or,
  sql,
} from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import {
  appReview,
  type PeriodType,
  poiBoundaries,
  userPeriodScores,
  users,
  visitedPois,
} from "../schema.js";
import { isUniqueConstraintViolationError } from "../utils.js";

interface LeaderboardCursor {
  score: number;
  userId: string;
}

function encodeLeaderboardCursor(cursor: LeaderboardCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeLeaderboardCursor(s: string): LeaderboardCursor | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(s, "base64url").toString("utf-8"),
    );
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "score" in parsed &&
      "userId" in parsed &&
      typeof parsed.score === "number" &&
      typeof parsed.userId === "string"
    ) {
      return { score: parsed.score, userId: parsed.userId };
    }
    return null;
  } catch {
    return null;
  }
}

function leaderboardPeriodToTuple(period: "all-time" | "monthly"): {
  periodType: PeriodType;
  periodKey: string;
} {
  if (period === "all-time") {
    return { periodType: "all_time", periodKey: "" };
  }
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return { periodType: "monthly", periodKey: `${year}-${month}` };
}

export interface UserInfo {
  email: string;
  fullName: string;
  nickname: string | null;
  oauthProviders: string[];
  lastLogin: Date;
  isPrivate: boolean;
}

export interface PublicUserInfo {
  id: string;
  fullName: string;
  nickname: string | null;
  createdAt: Date;
  isPrivate: boolean;
}

export type DbUser = Omit<typeof users.$inferSelect, "fullName"> & {
  fullName: string;
};

type LeaderboardResult = Array<{
  userId: string;
  fullName: string;
  nickname: string | null;
  visitedPoisCount: number;
  registrationDate: string;
  lastVisitedPoiDate: string | null;
  rank: number;
}>;

export class AppReviewAlreadyExistsError extends Error {
  constructor() {
    super("App review already exists for this user");
    this.name = "AppReviewAlreadyExistsError";
  }
}

export class UserRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getLeaderboard(
    period: "all-time" | "monthly",
    startOfMonth: Date,
  ): Promise<LeaderboardResult> {
    const usersWithCounts = await this.db
      .select({
        userId: users.userId,
        fullName: users.fullName,
        nickname: users.nickname,
        email: users.email,
        createdAt: users.createdAt,
        visitedPoisCount: countDistinct(visitedPois.poiId),
        lastVisitedPoiDate: max(visitedPois.createdAt),
      })
      .from(users)
      .innerJoin(
        visitedPois,
        and(
          eq(users.userId, visitedPois.userId),
          period === "monthly"
            ? gte(visitedPois.createdAt, startOfMonth)
            : undefined,
        ),
      )
      .where(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(poiBoundaries)
            .where(eq(poiBoundaries.poiId, visitedPois.poiId)),
        ),
      )
      .groupBy(users.userId)
      .orderBy(desc(countDistinct(visitedPois.poiId)));

    return usersWithCounts
      .map((user) => ({
        userId: user.userId,
        fullName: getUserDisplayName(user.fullName, user.email),
        nickname: user.nickname,
        visitedPoisCount: user.visitedPoisCount,
        registrationDate: user.createdAt.toISOString(),
        lastVisitedPoiDate:
          user.lastVisitedPoiDate !== null
            ? user.lastVisitedPoiDate.toISOString()
            : null,
      }))
      .sort((a, b) => b.visitedPoisCount - a.visitedPoisCount)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
  }

  async upsertUser(
    userId: string,
    userInfo: Omit<UserInfo, "nickname" | "isPrivate">,
  ): Promise<{ user: DbUser; isNew: boolean }> {
    try {
      return await this.db.transaction(
        async (tx) => {
          // Lock the row for this user to prevent race conditions
          const existingUser = await tx.query.users.findFirst({
            where: eq(users.userId, userId),
            columns: { userId: true, oauthProviders: true, createdAt: true },
          });

          const isNew = existingUser === undefined;

          const newOauthProviders =
            existingUser?.oauthProviders !== null &&
            existingUser?.oauthProviders !== undefined
              ? Array.from(
                  new Set([
                    ...existingUser.oauthProviders,
                    ...userInfo.oauthProviders,
                  ]),
                )
              : userInfo.oauthProviders;

          const [dbUser] = await tx
            .insert(users)
            .values({
              userId: userId,
              ...userInfo,
              oauthProviders: newOauthProviders,
            })
            .onConflictDoUpdate({
              target: users.userId,
              set: {
                ...userInfo,
                oauthProviders: newOauthProviders,
              },
            })
            .returning();

          if (dbUser === undefined) {
            throw new Error("Failed to upsert user");
          }

          return {
            user: {
              ...dbUser,
              fullName: getUserDisplayName(dbUser.fullName, dbUser.email),
            },
            isNew,
          };
        },
        {
          isolationLevel: "serializable",
        },
      );
    } catch (error) {
      // Handle concurrent update error - this happens when multiple requests
      // try to update the same user simultaneously

      // Debug logging to understand error structure
      if (error instanceof Error) {
        logger.info(
          `upsertUser error - Type: ${error.constructor.name}, Message: ${error.message.substring(0, 200)}`,
        );
        if (error.cause instanceof Error) {
          logger.info(
            `upsertUser error cause - Message: ${error.cause.message}`,
          );
        }
      }

      const isConcurrentUpdateError =
        error instanceof Error &&
        (error.message.includes(
          "could not serialize access due to concurrent update",
        ) ||
          (error.cause instanceof Error &&
            error.cause.message.includes(
              "could not serialize access due to concurrent update",
            )));

      if (isConcurrentUpdateError) {
        logger.warn(
          `Concurrent update detected for user ${userId}, fetching existing user instead`,
        );

        // Fetch the existing user since another transaction already updated it
        const existingUser = await this.db.query.users.findFirst({
          where: eq(users.userId, userId),
        });

        if (existingUser === undefined) {
          throw new Error(
            `User ${userId} not found after concurrent update error`,
          );
        }

        return {
          user: {
            ...existingUser,
            fullName: getUserDisplayName(
              existingUser.fullName,
              existingUser.email,
            ),
          },
          isNew: false,
        };
      }

      // Re-throw any other errors
      throw error;
    }
  }

  async getPublicUserInfo(userId: string): Promise<PublicUserInfo | null> {
    const retrievedUser = await this.db.query.users.findFirst({
      where: eq(users.userId, userId),
      columns: {
        userId: true,
        fullName: true,
        nickname: true,
        email: true,
        createdAt: true,
        isPrivate: true,
      },
    });

    if (retrievedUser === undefined) {
      return null;
    }

    return {
      id: retrievedUser.userId,
      fullName: getUserDisplayName(retrievedUser.fullName, retrievedUser.email),
      nickname: retrievedUser.nickname,
      createdAt: retrievedUser.createdAt,
      isPrivate: retrievedUser.isPrivate,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Set cascade context so child triggers attribute the deletion to this user
      await tx.execute(
        sql`SELECT set_config('archive.cause_table', 'users', true), set_config('archive.cause_id', ${userId}, true)`,
      );
      await tx.delete(visitedPois).where(eq(visitedPois.userId, userId));
      await tx.delete(users).where(eq(users.userId, userId));
    });
  }

  async updateUser(
    userId: string,
    userInfo: Partial<Pick<UserInfo, "nickname" | "isPrivate">>,
  ): Promise<void> {
    await this.db
      .update(users)
      .set({
        nickname: userInfo.nickname,
        isPrivate: userInfo.isPrivate,
      })
      .where(eq(users.userId, userId));
  }

  async hasUserAppReview(userId: string): Promise<boolean> {
    const retrievedAppReview = await this.db.query.appReview.findFirst({
      where: eq(appReview.userId, userId),
      columns: { id: true },
    });

    return retrievedAppReview !== undefined;
  }

  async createAppReview(
    userId: string,
    positive: boolean,
    comment: string | null,
  ): Promise<void> {
    try {
      await this.db.insert(appReview).values({
        userId,
        positive,
        comment,
      });
    } catch (error) {
      if (isUniqueConstraintViolationError(error)) {
        throw new AppReviewAlreadyExistsError();
      }
      throw error;
    }
  }

  // Leaderboard v2 : lecture depuis user_period_scores avec cursor pagination.
  // Le cursor encode (score, userId) — tiebreaker stable sur userId asc.
  async getLeaderboardV2({
    period,
    after,
    limit,
  }: {
    period: "all-time" | "monthly";
    after: string | undefined;
    limit: number;
  }): Promise<{ items: LeaderboardResult; nextCursor: string | null }> {
    const { periodType, periodKey } = leaderboardPeriodToTuple(period);
    const cursor = after !== undefined ? decodeLeaderboardCursor(after) : null;

    const rows = await this.db
      .select({
        userId: users.userId,
        fullName: users.fullName,
        nickname: users.nickname,
        email: users.email,
        createdAt: users.createdAt,
        visitedPoisCount: userPeriodScores.count,
        lastVisitedPoiDate:
          sql`(SELECT MAX(${visitedPois.createdAt}) FROM ${visitedPois} WHERE ${visitedPois.userId} = ${users.userId})`
            .mapWith((v: unknown): Date | null => {
              if (v === null) return null;
              if (v instanceof Date) return v;
              if (typeof v === "string") return new Date(v);
              return null;
            })
            .as("last_visited_poi_date"),
      })
      .from(userPeriodScores)
      .innerJoin(users, eq(users.userId, userPeriodScores.userId))
      .where(
        and(
          eq(userPeriodScores.periodType, periodType),
          eq(userPeriodScores.periodKey, periodKey),
          cursor !== null
            ? or(
                sql`${userPeriodScores.count} < ${cursor.score}`,
                and(
                  eq(userPeriodScores.count, cursor.score),
                  gt(userPeriodScores.userId, cursor.userId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(userPeriodScores.count), asc(userPeriodScores.userId))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeLeaderboardCursor({
            score: last.visitedPoisCount,
            userId: last.userId,
          })
        : null;

    // Rank absolu : on calcule celui du 1er item avec une seule query (COUNT
    // des users devant lui), puis on incrémente. Comme on lit la même slice
    // ORDER BY (count DESC, userId ASC) que celle qui donnerait le rank
    // global, les items sont consécutifs dans le classement => rank[i+1] =
    // rank[i] + 1.
    let baseRank = 0;
    const first = items[0];
    if (first !== undefined) {
      const rankRows = await this.db
        .select({
          rank: sql`COUNT(*) + 1`.mapWith(Number),
        })
        .from(userPeriodScores)
        .where(
          and(
            eq(userPeriodScores.periodType, periodType),
            eq(userPeriodScores.periodKey, periodKey),
            or(
              sql`${userPeriodScores.count} > ${first.visitedPoisCount}`,
              and(
                eq(userPeriodScores.count, first.visitedPoisCount),
                sql`${userPeriodScores.userId} < ${first.userId}`,
              ),
            ),
          ),
        );
      baseRank = rankRows[0]?.rank ?? 1;
    }

    return {
      items: items.map((row, idx) => ({
        userId: row.userId,
        fullName: getUserDisplayName(row.fullName, row.email),
        nickname: row.nickname,
        visitedPoisCount: row.visitedPoisCount,
        registrationDate: row.createdAt.toISOString(),
        lastVisitedPoiDate:
          row.lastVisitedPoiDate !== null
            ? row.lastVisitedPoiDate.toISOString()
            : null,
        rank: baseRank + idx,
      })),
      nextCursor,
    };
  }

  // Mon rank + voisins immédiats — pour la section sticky du leaderboard.
  async getLeaderboardMe({
    userId,
    period,
    neighborsEachSide = 2,
  }: {
    userId: string;
    period: "all-time" | "monthly";
    neighborsEachSide?: number;
  }): Promise<{
    me: LeaderboardResult[number] | null;
    neighbors: LeaderboardResult;
  }> {
    const { periodType, periodKey } = leaderboardPeriodToTuple(period);

    const [myScoreRow] = await this.db
      .select({
        count: userPeriodScores.count,
      })
      .from(userPeriodScores)
      .where(
        and(
          eq(userPeriodScores.userId, userId),
          eq(userPeriodScores.periodType, periodType),
          eq(userPeriodScores.periodKey, periodKey),
        ),
      );

    if (myScoreRow === undefined) {
      return { me: null, neighbors: [] };
    }

    const myScore = myScoreRow.count;

    // Rank = nombre de users devant moi + 1
    const [rankRow] = await this.db
      .select({
        rank: sql`COUNT(*) + 1`.mapWith(Number),
      })
      .from(userPeriodScores)
      .where(
        and(
          eq(userPeriodScores.periodType, periodType),
          eq(userPeriodScores.periodKey, periodKey),
          or(
            sql`${userPeriodScores.count} > ${myScore}`,
            and(
              eq(userPeriodScores.count, myScore),
              sql`${userPeriodScores.userId} < ${userId}`,
            ),
          ),
        ),
      );

    const myRank = rankRow?.rank ?? 1;

    // Voisins : ceux devant moi (score >= moi) et ceux derrière (score <= moi)
    // Limite : neighborsEachSide de chaque côté + moi-même au milieu
    const aboveRows = await this.db
      .select({
        userId: users.userId,
        fullName: users.fullName,
        nickname: users.nickname,
        email: users.email,
        createdAt: users.createdAt,
        score: userPeriodScores.count,
      })
      .from(userPeriodScores)
      .innerJoin(users, eq(users.userId, userPeriodScores.userId))
      .where(
        and(
          eq(userPeriodScores.periodType, periodType),
          eq(userPeriodScores.periodKey, periodKey),
          or(
            sql`${userPeriodScores.count} > ${myScore}`,
            and(
              eq(userPeriodScores.count, myScore),
              sql`${userPeriodScores.userId} < ${userId}`,
            ),
          ),
        ),
      )
      .orderBy(asc(userPeriodScores.count), desc(userPeriodScores.userId))
      .limit(neighborsEachSide);

    const belowRows = await this.db
      .select({
        userId: users.userId,
        fullName: users.fullName,
        nickname: users.nickname,
        email: users.email,
        createdAt: users.createdAt,
        score: userPeriodScores.count,
      })
      .from(userPeriodScores)
      .innerJoin(users, eq(users.userId, userPeriodScores.userId))
      .where(
        and(
          eq(userPeriodScores.periodType, periodType),
          eq(userPeriodScores.periodKey, periodKey),
          or(
            sql`${userPeriodScores.count} < ${myScore}`,
            and(
              eq(userPeriodScores.count, myScore),
              sql`${userPeriodScores.userId} > ${userId}`,
            ),
          ),
        ),
      )
      .orderBy(desc(userPeriodScores.count), asc(userPeriodScores.userId))
      .limit(neighborsEachSide);

    // Récupérer mon user info + last visited poi
    const [myUser] = await this.db
      .select({
        userId: users.userId,
        fullName: users.fullName,
        nickname: users.nickname,
        email: users.email,
        createdAt: users.createdAt,
        lastVisitedPoiDate: max(visitedPois.createdAt),
      })
      .from(users)
      .leftJoin(visitedPois, eq(visitedPois.userId, users.userId))
      .where(eq(users.userId, userId))
      .groupBy(users.userId);

    const me =
      myUser !== undefined
        ? {
            userId: myUser.userId,
            fullName: getUserDisplayName(myUser.fullName, myUser.email),
            nickname: myUser.nickname,
            visitedPoisCount: myScore,
            registrationDate: myUser.createdAt.toISOString(),
            lastVisitedPoiDate:
              myUser.lastVisitedPoiDate !== null
                ? myUser.lastVisitedPoiDate.toISOString()
                : null,
            rank: myRank,
          }
        : null;

    // Ranks pour les voisins : interpolés à partir de myRank
    // (above sont rank-N..rank-1, below sont rank+1..rank+N)
    const aboveSorted = [...aboveRows].reverse(); // remettre par rank croissant
    const neighbors: LeaderboardResult = [
      ...aboveSorted.map((row, idx) => ({
        userId: row.userId,
        fullName: getUserDisplayName(row.fullName, row.email),
        nickname: row.nickname,
        visitedPoisCount: row.score,
        registrationDate: row.createdAt.toISOString(),
        lastVisitedPoiDate: null,
        rank: myRank - (aboveSorted.length - idx),
      })),
      ...belowRows.map((row, idx) => ({
        userId: row.userId,
        fullName: getUserDisplayName(row.fullName, row.email),
        nickname: row.nickname,
        visitedPoisCount: row.score,
        registrationDate: row.createdAt.toISOString(),
        lastVisitedPoiDate: null,
        rank: myRank + idx + 1,
      })),
    ];

    return { me, neighbors };
  }
}
