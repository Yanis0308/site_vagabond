import {
  and,
  asc,
  eq,
  exists,
  gte,
  isNull,
  lt,
  notExists,
  sql,
} from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { pushDevices, users, visitedPois } from "../schema.js";

/**
 * Candidat retourné par les sélecteurs de cron. `lastLogin` (= dernière requête
 * API authentifiée, rafraîchie à chaque appel par le hook d'auth) sert de proxy
 * d'activité in-app pour la règle anti-spam `recent_session` côté orchestrateur.
 */
export interface NotificationCandidateUser {
  userId: string;
  lastLogin: Date;
}

export class NotificationCandidateRepository {
  constructor(private readonly db: DrizzleClient) {}

  /**
   * Users signed up ≥ 24h ago who haven't validated any POI yet. Filters out
   * users without active push devices to avoid wasted dispatch cycles.
   */
  async findFirstPlacePromptCandidates(
    limit: number,
  ): Promise<NotificationCandidateUser[]> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await this.db
      .select({ userId: users.userId, lastLogin: users.lastLogin })
      .from(users)
      .where(
        and(
          lt(users.createdAt, cutoff),
          exists(
            this.db
              .select({ one: sql`1` })
              .from(pushDevices)
              .where(
                and(
                  eq(pushDevices.userId, users.userId),
                  isNull(pushDevices.disabledAt),
                ),
              ),
          ),
          notExists(
            this.db
              .select({ one: sql`1` })
              .from(visitedPois)
              .where(eq(visitedPois.userId, users.userId)),
          ),
        ),
      )
      .orderBy(asc(users.userId))
      .limit(limit);
    return rows;
  }

  /**
   * Users whose most recent visited POI is between 7 and 2 days old. Mutually
   * exclusive with `first_place_prompt` cohort (which excludes users with any
   * visited POI) and with the `inactive_7d` cohort (≥ 7 days).
   */
  async findInactive2dCandidates(
    limit: number,
  ): Promise<NotificationCandidateUser[]> {
    return await this.findInactiveCandidatesByLastVisitWindow({
      minHoursSinceLastVisit: 2 * 24,
      maxHoursSinceLastVisit: 7 * 24,
      limit,
    });
  }

  /**
   * Users whose most recent visited POI is ≥ 7 days old.
   */
  async findInactive7dCandidates(
    limit: number,
  ): Promise<NotificationCandidateUser[]> {
    return await this.findInactiveCandidatesByLastVisitWindow({
      minHoursSinceLastVisit: 7 * 24,
      maxHoursSinceLastVisit: null,
      limit,
    });
  }

  private async findInactiveCandidatesByLastVisitWindow(args: {
    minHoursSinceLastVisit: number;
    maxHoursSinceLastVisit: number | null;
    limit: number;
  }): Promise<NotificationCandidateUser[]> {
    const now = Date.now();
    const upperBound = new Date(
      now - args.minHoursSinceLastVisit * 60 * 60 * 1000,
    );
    const lowerBound =
      args.maxHoursSinceLastVisit !== null
        ? new Date(now - args.maxHoursSinceLastVisit * 60 * 60 * 1000)
        : null;

    // Subquery: latest visited POI timestamp per user
    const latest = sql`(
      SELECT MAX(${visitedPois.createdAt})
      FROM ${visitedPois}
      WHERE ${visitedPois.userId} = ${users.userId}
    )`;

    const rows = await this.db
      .select({ userId: users.userId, lastLogin: users.lastLogin })
      .from(users)
      .where(
        and(
          exists(
            this.db
              .select({ one: sql`1` })
              .from(pushDevices)
              .where(
                and(
                  eq(pushDevices.userId, users.userId),
                  isNull(pushDevices.disabledAt),
                ),
              ),
          ),
          sql`${latest} IS NOT NULL`,
          sql`${latest} < ${upperBound}`,
          lowerBound !== null ? gte(latest, lowerBound) : undefined,
        ),
      )
      .orderBy(asc(users.userId))
      .limit(args.limit);
    return rows;
  }
}
