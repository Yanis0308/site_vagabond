import { getUserDisplayName, logger } from "@vagabond/shared-utils";
import { and, count, desc, eq, gte, max } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { users, visitedPois } from "../schema.js";

export interface UserInfo {
  email: string;
  fullName: string;
  oauthProviders: string[];
  lastLogin: Date;
}

export interface PublicUserInfo {
  id: string;
  fullName: string;
  createdAt: Date;
}

export type DbUser = Omit<typeof users.$inferSelect, "fullName"> & {
  fullName: string;
};

type LeaderboardResult = Array<{
  userId: string;
  fullName: string;
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
      .innerJoin(
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
        fullName: getUserDisplayName(user.fullName, user.email),
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
      columns: { userId: true, fullName: true, email: true, createdAt: true },
    });

    if (retrievedUser === undefined) {
      return null;
    }

    return {
      id: retrievedUser.userId,
      fullName: getUserDisplayName(retrievedUser.fullName, retrievedUser.email),
      createdAt: retrievedUser.createdAt,
    };
  }
}
