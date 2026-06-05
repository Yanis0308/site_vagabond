import {
  NOTIFICATION_CRON_BATCH_LIMIT,
  NOTIFICATION_TEMPLATES,
} from "@vagabond/shared-utils";
import type { FastifyInstance } from "fastify";

import { getLogger } from "../../utils/logger.js";
import { dispatchNotificationsForUsers } from "./dispatch.js";

export const INACTIVE_2D_QUEUE = "notification-inactive-2d";
// Toutes les heures de 8h à 21h heure de Paris, minute 10 (décalé de
// first_place minute 0 et inactive_7d minute 20 pour étaler la charge).
export const INACTIVE_2D_CRON = "10 8-21 * * *";

/**
 * Cible : utilisateurs dont le dernier `visited_pois.created_at` tombe entre
 * 7 jours et 2 jours. Cohorte mutuellement exclusive avec `first_place_prompt`
 * (qui exige zéro visited POI) et `inactive_7d` (qui prend les ≥ 7 j).
 */
export async function registerInactive2dWorker(
  fastify: FastifyInstance,
): Promise<void> {
  await fastify.pgboss.work<Record<string, never>>(
    INACTIVE_2D_QUEUE,
    { pollingIntervalSeconds: 5 },
    async (jobs): Promise<void> => {
      const log = getLogger(fastify);
      const template = NOTIFICATION_TEMPLATES.inactive_2d;

      for (const job of jobs) {
        const candidateUsers =
          await fastify.dbRepositories.notificationCandidate.findInactive2dCandidates(
            NOTIFICATION_CRON_BATCH_LIMIT,
          );

        log.info(
          { jobId: job.id, candidates: candidateUsers.length },
          "inactive_2d_cron_tick",
        );

        if (candidateUsers.length >= NOTIFICATION_CRON_BATCH_LIMIT) {
          log.warn(
            { candidates: candidateUsers.length },
            "inactive_2d_batch_limit_hit",
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
    { queue: INACTIVE_2D_QUEUE, cron: INACTIVE_2D_CRON },
    "inactive_2d worker registered",
  );
}
