import { type NotificationTemplateKey } from "@vagabond/shared-utils";
import type { FastifyInstance } from "fastify";
import pMap from "p-map";

import {
  type OrchestratorCandidate,
  selectNextNotification,
  type UserNotificationStats,
} from "../../services/notification-orchestrator.service.js";
import { sendNotification } from "../../services/notification-sender.service.js";
import { getLogger } from "../../utils/logger.js";

/**
 * Concurrency for batched dispatch. Each task fans out ~4 parallel queries
 * in `loadStats`, so 5 × 4 ≈ 20 in-flight DB queries — aligned with the
 * pg pool `max: 20` configured in drizzleClient. Well below the FCM 600k
 * messages/min project quota.
 */
const DISPATCH_CONCURRENCY = 5;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

// V0 : timezone hardcodée Europe/Paris (cf. spec PR5).
const USER_TIMEZONE = "Europe/Paris";

export const localHourFor = (now: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "0";
  return Number.parseInt(hour, 10);
};

const loadStats = async (
  fastify: FastifyInstance,
  userId: string,
  candidates: OrchestratorCandidate[],
  now: Date,
  lastSessionAt: Date | null,
): Promise<UserNotificationStats> => {
  const repo = fastify.dbRepositories.notificationEvent;
  const since24h = new Date(now.getTime() - DAY_MS);
  const since7d = new Date(now.getTime() - WEEK_MS);

  const [countLast24h, countLast7d, lastSentAtAcrossAll] = await Promise.all([
    repo.countSinceForUser(userId, since24h),
    repo.countSinceForUser(userId, since7d),
    repo.getLastSentAtForUser(userId),
  ]);

  const lastSentAtPerTemplate = new Map<NotificationTemplateKey, Date>();
  await Promise.all(
    candidates.map(async (candidate) => {
      const last = await repo.getLastSentAtForTemplate(
        userId,
        candidate.template.key,
      );
      if (last !== null) {
        lastSentAtPerTemplate.set(candidate.template.key, last);
      }
    }),
  );

  // `lastSessionAt` = `users.last_login`, fourni par le worker depuis la requête
  // candidate. C'est la dernière requête API authentifiée (rafraîchie à chaque
  // appel par le hook d'auth), utilisée comme proxy d'activité in-app par la
  // règle `recent_session`.
  return {
    lastSentAtAcrossAll,
    lastSentAtPerTemplate,
    countLast24h,
    countLast7d,
    lastSessionAt,
  };
};

export interface DispatchOutcome {
  userId: string;
  result:
    | "sent"
    | "failed"
    | "skipped"
    | "rejected"
    | "render_failed"
    | "no_active_devices"
    | "quota_exceeded";
  reason?: string;
  templateKey?: NotificationTemplateKey;
  notificationId?: string;
  rateLimited?: boolean;
}

export interface UserDispatchInput {
  userId: string;
  candidates: OrchestratorCandidate[];
  // Proxy d'activité in-app (= `users.last_login`) pour la règle
  // `recent_session`. `null` désactive la règle pour cet utilisateur.
  lastSessionAt?: Date | null;
}

/**
 * Pipeline complet pour un utilisateur :
 *   1. Stats anti-spam
 *   2. Orchestrateur (filtres + scoring)
 *   3. Calcul du `variantIndex` depuis `countSentForTemplate`
 *   4. Envoi via le sender
 *
 * Le caller (worker) est responsable de :
 *   - Sélectionner les utilisateurs candidats (requête SQL par template).
 *   - Construire les `candidates` (template + variables + triggerCoords).
 */
export const dispatchNotificationForUser = async (
  fastify: FastifyInstance,
  args: {
    userId: string;
    candidates: OrchestratorCandidate[];
    now?: Date;
    lastSessionAt?: Date | null;
  },
): Promise<DispatchOutcome> => {
  const now = args.now ?? new Date();
  const { userId, candidates } = args;
  const lastSessionAt = args.lastSessionAt ?? null;

  if (candidates.length === 0) {
    return { userId, result: "rejected", reason: "no_candidates" };
  }

  const stats = await loadStats(
    fastify,
    userId,
    candidates,
    now,
    lastSessionAt,
  );
  const localHour = localHourFor(now, USER_TIMEZONE);

  const decision = selectNextNotification(candidates, {
    now,
    localHour,
    stats,
  });

  if (decision.outcome === "rejected") {
    // Pas de log par utilisateur ici : il tournerait sur tout le batch à
    // chaque tick cron. Les rejets (et autres issues) sont agrégés dans le
    // recap émis par `dispatchNotificationsForUsers`.
    return { userId, result: "rejected", reason: decision.reason };
  }

  const templateKey = decision.candidate.template.key;
  const variantIndex =
    await fastify.dbRepositories.notificationEvent.countSentForTemplate(
      userId,
      templateKey,
    );

  const outcome = await sendNotification(fastify, {
    userId,
    candidate: decision.candidate,
    variantIndex,
  });

  if (outcome.status === "sent") {
    return {
      userId,
      result: "sent",
      templateKey,
      notificationId: outcome.notificationId,
      rateLimited: outcome.rateLimited,
    };
  }
  if (outcome.status === "failed") {
    return {
      userId,
      result: "failed",
      templateKey,
      notificationId: outcome.notificationId,
      reason: outcome.reason,
      rateLimited: outcome.rateLimited,
    };
  }
  return { userId, result: outcome.reason, templateKey };
};

/**
 * Bounded-concurrency batch dispatch for cron workers.
 *
 * - Runs `dispatchNotificationForUser` for each input via `p-map` with
 *   `DISPATCH_CONCURRENCY` workers in flight.
 * - Short-circuits the rest of the batch as soon as one task reports
 *   `rateLimited` (FCM HTTP 429 / `messaging/message-rate-exceeded`) : the
 *   token bucket is exhausted at project level, so further sends would also
 *   429 and burn DB cycles for nothing. Skipped users return a
 *   `quota_exceeded` outcome and remain naturally eligible at the next cron
 *   tick (no `notification_events` row written for them).
 */
export const dispatchNotificationsForUsers = async (
  fastify: FastifyInstance,
  inputs: UserDispatchInput[],
  options: { now?: Date; concurrency?: number } = {},
): Promise<DispatchOutcome[]> => {
  const log = getLogger(fastify);
  // Snap once for the whole batch so anti-spam windows (loadStats) are
  // computed against a stable T0 instead of drifting per-task.
  const now = options.now ?? new Date();
  let quotaExceeded = false;

  const outcomes = await pMap<UserDispatchInput, DispatchOutcome>(
    inputs,
    async (input) => {
      if (quotaExceeded) {
        return {
          userId: input.userId,
          result: "quota_exceeded",
          reason: "batch_short_circuit",
        };
      }
      const outcome = await dispatchNotificationForUser(fastify, {
        userId: input.userId,
        candidates: input.candidates,
        now,
        lastSessionAt: input.lastSessionAt ?? null,
      });
      if (outcome.rateLimited === true) {
        quotaExceeded = true;
        log.warn(
          {
            userId: input.userId,
            templateKey: outcome.templateKey,
            reason: outcome.reason,
          },
          "notification_dispatch_quota_exceeded_short_circuit",
        );
      }
      return outcome;
    },
    { concurrency: options.concurrency ?? DISPATCH_CONCURRENCY },
  );

  // Un seul log de recap par batch (vs un log par utilisateur rejeté) : on
  // garde la visibilité sur l'issue de chaque tick cron sans inonder les logs.
  if (outcomes.length > 0) {
    const byResult: Record<DispatchOutcome["result"], number> = {
      sent: 0,
      failed: 0,
      skipped: 0,
      rejected: 0,
      render_failed: 0,
      no_active_devices: 0,
      quota_exceeded: 0,
    };
    const rejectedReasons: Record<string, number> = {};
    for (const outcome of outcomes) {
      byResult[outcome.result] += 1;
      if (outcome.result === "rejected" && outcome.reason !== undefined) {
        rejectedReasons[outcome.reason] =
          (rejectedReasons[outcome.reason] ?? 0) + 1;
      }
    }
    log.info(
      { total: outcomes.length, ...byResult, rejectedReasons, quotaExceeded },
      "notification_dispatch_batch_recap",
    );
  }

  return outcomes;
};
