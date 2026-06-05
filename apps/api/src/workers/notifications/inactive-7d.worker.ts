import {
  NOTIFICATION_CRON_BATCH_LIMIT,
  NOTIFICATION_TEMPLATES,
} from "@vagabond/shared-utils";
import type { FastifyInstance } from "fastify";

import { getLogger } from "../../utils/logger.js";
import { dispatchNotificationsForUsers } from "./dispatch.js";

export const INACTIVE_7D_QUEUE = "notification-inactive-7d";
// Toutes les heures de 8h à 21h heure de Paris, minute 20 (décalé de
// first_place minute 0 et inactive_2d minute 10 pour étaler la charge).
export const INACTIVE_7D_CRON = "20 8-21 * * *";

/**
 * Cible : utilisateurs dont le dernier `visited_pois.created_at` est ≥ 7 jours.
 */
export async function registerInactive7dWorker(
  fastify: FastifyInstance,
): Promise<void> {
  await fastify.pgboss.work<Record<string, never>>(
    INACTIVE_7D_QUEUE,
    { pollingIntervalSeconds: 5 },
    async (jobs): Promise<void> => {
      const log = getLogger(fastify);
      const template = NOTIFICATION_TEMPLATES.inactive_7d;

      for (const job of jobs) {
        const candidateUsers =
          await fastify.dbRepositories.notificationCandidate.findInactive7dCandidates(
            NOTIFICATION_CRON_BATCH_LIMIT,
          );

        log.info(
          { jobId: job.id, candidates: candidateUsers.length },
          "inactive_7d_cron_tick",
        );

        if (candidateUsers.length >= NOTIFICATION_CRON_BATCH_LIMIT) {
          log.warn(
            { candidates: candidateUsers.length },
            "inactive_7d_batch_limit_hit",
          );
        }

        await dispatchNotificationsForUsers(
          fastify,
          candidateUsers.map((user) => ({
            userId: user.userId,
            lastSessionAt: user.lastLogin,
            candidates: [{ template, variables: {}, triggerCoords: null }],
          })),
        );
      }
    },
  );

  getLogger(fastify).info(
    { queue: INACTIVE_7D_QUEUE, cron: INACTIVE_7D_CRON },
    "inactive_7d worker registered",
  );
}
