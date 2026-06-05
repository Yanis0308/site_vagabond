import {
  NOTIFICATION_CRON_BATCH_LIMIT,
  NOTIFICATION_TEMPLATES,
} from "@vagabond/shared-utils";
import type { FastifyInstance } from "fastify";

import { getLogger } from "../../utils/logger.js";
import { dispatchNotificationsForUsers } from "./dispatch.js";

export const FIRST_PLACE_PROMPT_QUEUE = "notification-first-place-prompt";
// Toutes les heures de 8h à 21h heure de Paris (minute 0), pour ne pas faire
// attendre jusqu'au lendemain un utilisateur devenu éligible en cours de
// journée. La fenêtre reste à l'écart des quiet hours [22h, 7h) Paris ;
// l'anti-spam + cooldown 48h empêche les envois en double. Décalé à la minute
// 0 (vs inactive_2d minute 10, inactive_7d minute 20) pour étaler la charge.
export const FIRST_PLACE_PROMPT_CRON = "0 8-21 * * *";

/**
 * Cible : utilisateurs inscrits depuis ≥ 24 h et qui n'ont validé AUCUN lieu.
 * La sélection est faite en SQL via `findFirstPlacePromptCandidates`. La
 * décision finale (anti-spam, cooldown 48 h, variant) revient à l'orchestrateur
 * dans le dispatcher.
 */
export async function registerFirstPlacePromptWorker(
  fastify: FastifyInstance,
): Promise<void> {
  await fastify.pgboss.work<Record<string, never>>(
    FIRST_PLACE_PROMPT_QUEUE,
    { pollingIntervalSeconds: 5 },
    async (jobs): Promise<void> => {
      const log = getLogger(fastify);
      const template = NOTIFICATION_TEMPLATES.first_place_prompt;

      for (const job of jobs) {
        const candidateUsers =
          await fastify.dbRepositories.notificationCandidate.findFirstPlacePromptCandidates(
            NOTIFICATION_CRON_BATCH_LIMIT,
          );

        log.info(
          { jobId: job.id, candidates: candidateUsers.length },
          "first_place_prompt_cron_tick",
        );

        if (candidateUsers.length >= NOTIFICATION_CRON_BATCH_LIMIT) {
          log.warn(
            { candidates: candidateUsers.length },
            "first_place_prompt_batch_limit_hit",
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
    { queue: FIRST_PLACE_PROMPT_QUEUE, cron: FIRST_PLACE_PROMPT_CRON },
    "first_place_prompt worker registered",
  );
}
