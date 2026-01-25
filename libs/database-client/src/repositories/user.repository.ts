import { and, count, desc, eq, gte, max } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { users, visitedPois } from "../schema.js";

export interface UserInfo {
  email: string;
  fullName: string;
  oauthProviders: string[];
  lastLogin: Date;
}

export type DbUser = typeof users.$inferSelect;

type LeaderboardResult = Array<{
  userId: string;
  fullName: string | null;
  email: string | null;
  visitedPoisCount: number;
  registrationDate: string;
  lastVisitedPoiDate: string | null;
  rank: number;
}>;

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
        email: users.email,
        createdAt: users.createdAt,
        visitedPoisCount: count(visitedPois.id),
        lastVisitedPoiDate: max(visitedPois.createdAt),
      })
      .from(users)
      .leftJoin(
        visitedPois,
        and(
          eq(users.userId, visitedPois.userId),
          period === "monthly"
            ? gte(visitedPois.createdAt, startOfMonth)
            : undefined,
        ),
      )
      .groupBy(users.userId)
      .orderBy(desc(count(visitedPois.id)));

    return usersWithCounts
      .map((user) => ({
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
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
    userInfo: UserInfo,
  ): Promise<{ user: DbUser; isNew: boolean }> {
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

        return { user: dbUser, isNew };
      },
      {
        isolationLevel: "serializable",
      },
    );
  }
}
