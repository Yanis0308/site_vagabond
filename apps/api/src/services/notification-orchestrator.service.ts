import {
  MAX_PUSH_PER_DAY,
  MAX_PUSH_PER_WEEK,
  MIN_HOURS_BETWEEN_PUSH,
  type NotificationPriority,
  type NotificationTemplate,
  type NotificationTemplateKey,
  QUIET_HOURS_END,
  QUIET_HOURS_START,
  RECENT_SESSION_HOURS,
} from "@vagabond/shared-utils";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

// Écart > 1 entre tiers pour que `recencyBonus` (∈ [0, 1]) ne puisse jamais
// pont entre deux priorités : un HIGH éligible bat toujours un MEDIUM
// éligible, peu importe leur récence respective. Idem MEDIUM > LOW.
const PRIORITY_WEIGHT: Record<NotificationPriority, number> = {
  HIGH: 10,
  MEDIUM: 5,
  LOW: 1,
};

export type OrchestratorRejection =
  | "cap_day"
  | "cap_week"
  | "quiet_hours"
  | "min_gap"
  | "cooldown"
  | "recent_session"
  | "no_candidates";

export interface OrchestratorCandidate {
  template: NotificationTemplate;
  variables: Record<string, string>;
  /**
   * Trigger coords if the candidate is location-based (e.g. `entered_city`).
   * Persisted on the resulting `notification_events` row by the sender.
   */
  triggerCoords: { latitude: number; longitude: number } | null;
}

export interface UserNotificationStats {
  /** Latest sent_at across all templates (excluding failed events). */
  lastSentAtAcrossAll: Date | null;
  /** Latest sent_at per template (excluding failed events). */
  lastSentAtPerTemplate: Map<NotificationTemplateKey, Date>;
  /** Non-failed events count in the last 24h. */
  countLast24h: number;
  /** Non-failed events count in the last 7d. */
  countLast7d: number;
  /**
   * Last in-app session timestamp (heartbeat). Used by the `recent_session`
   * filter to avoid notifying an already-active user, unless the candidate is
   * HIGH priority.
   */
  lastSessionAt: Date | null;
}

export interface SelectionContext {
  now: Date;
  /**
   * Local hour-of-day (0..23) in the user's timezone, used to evaluate quiet
   * hours. The orchestrator stays pure — the caller (cron) computes this from
   * the hardcoded Europe/Paris timezone (V0).
   */
  localHour: number;
  stats: UserNotificationStats;
}

export interface SelectionAccepted {
  outcome: "selected";
  candidate: OrchestratorCandidate;
  score: number;
}

export interface SelectionRejected {
  outcome: "rejected";
  reason: OrchestratorRejection;
}

export type SelectionResult = SelectionAccepted | SelectionRejected;

const isQuietHour = (localHour: number): boolean => {
  // [START, END) modulo 24h. When START > END the window crosses midnight.
  // Cast to plain `number` so TypeScript doesn't compare the literal-typed
  // constants (which would render the branches statically unreachable).
  const start: number = QUIET_HOURS_START;
  const end: number = QUIET_HOURS_END;
  if (start === end) {
    return false;
  }
  if (start < end) {
    return localHour >= start && localHour < end;
  }
  return localHour >= start || localHour < end;
};

const passesCooldown = (
  template: NotificationTemplate,
  lastSentAt: Date | undefined,
  now: Date,
): boolean => {
  if (template.cooldownHours === null) {
    // `null` = unique en vie: once sent (any status except failed), never resent.
    return lastSentAt === undefined;
  }
  if (lastSentAt === undefined) {
    return true;
  }
  return (
    now.getTime() - lastSentAt.getTime() >= template.cooldownHours * HOUR_MS
  );
};

const recencyBonus = (
  template: NotificationTemplate,
  lastSentAt: Date | undefined,
  now: Date,
): number => {
  // Templates with no recent send get a full bonus; recently sent templates
  // get a smaller bonus, capped to 1 once we cross a week. This breaks ties
  // between equally-prioritized candidates in favor of "less recently seen".
  if (lastSentAt === undefined) {
    return 1;
  }
  const ratio = (now.getTime() - lastSentAt.getTime()) / WEEK_MS;
  if (ratio <= 0) {
    return 0;
  }
  return ratio >= 1 ? 1 : ratio;
};

const scoreCandidate = (
  candidate: OrchestratorCandidate,
  stats: UserNotificationStats,
  now: Date,
): number => {
  const last = stats.lastSentAtPerTemplate.get(candidate.template.key);
  return (
    PRIORITY_WEIGHT[candidate.template.priority] +
    recencyBonus(candidate.template, last, now)
  );
};

/**
 * Pure selection: applies anti-spam filters and picks the highest-scoring
 * candidate. The caller (cron job) is responsible for computing `variantIndex`
 * (from `countSentForTemplate`) and persisting the result via the sender.
 *
 * Filters applied (in order):
 *   1. Per-day cap        — global, no bypass.
 *   2. Per-week cap       — global, no bypass.
 *   3. Quiet hours        — global, no bypass.
 *   4. MIN_HOURS gap      — global, no bypass.
 *   5. Per-template cooldown — per candidate.
 *   6. Recent session     — per candidate, BYPASSED when priority is HIGH.
 */
export const selectNextNotification = (
  candidates: OrchestratorCandidate[],
  ctx: SelectionContext,
): SelectionResult => {
  if (candidates.length === 0) {
    return { outcome: "rejected", reason: "no_candidates" };
  }

  const { now, localHour, stats } = ctx;

  // Filtres globaux d'abord (caps → quiet → gap) : aucun candidat ne peut les
  // outrepasser, donc inutile d'itérer la liste si l'un échoue. L'ordre fixe
  // garantit aussi une raison de rejet déterministe et logue-able.
  if (stats.countLast24h >= MAX_PUSH_PER_DAY) {
    return { outcome: "rejected", reason: "cap_day" };
  }
  if (stats.countLast7d >= MAX_PUSH_PER_WEEK) {
    return { outcome: "rejected", reason: "cap_week" };
  }
  if (isQuietHour(localHour)) {
    return { outcome: "rejected", reason: "quiet_hours" };
  }
  if (stats.lastSentAtAcrossAll !== null) {
    const gapMs = now.getTime() - stats.lastSentAtAcrossAll.getTime();
    if (gapMs < MIN_HOURS_BETWEEN_PUSH * HOUR_MS) {
      return { outcome: "rejected", reason: "min_gap" };
    }
  }

  const recentSessionThreshold = RECENT_SESSION_HOURS * HOUR_MS;
  const isRecentlyActive =
    stats.lastSessionAt !== null &&
    now.getTime() - stats.lastSessionAt.getTime() < recentSessionThreshold;

  // On capture *pourquoi* chaque candidat est exclu pour pouvoir remonter une
  // raison de rejet précise au cron si la liste éligible finit vide. Sans ces
  // drapeaux on devrait re-tester après coup ou retomber sur `no_candidates`,
  // qui masquerait un vrai blocage anti-spam.
  const eligible: OrchestratorCandidate[] = [];
  let cooldownBlocked = false;
  let recentSessionBlocked = false;

  for (const candidate of candidates) {
    const last = stats.lastSentAtPerTemplate.get(candidate.template.key);
    if (!passesCooldown(candidate.template, last, now)) {
      cooldownBlocked = true;
      continue;
    }
    // Seule HIGH passe outre une session récente : un utilisateur déjà actif
    // in-app n'a pas besoin d'un push MEDIUM/LOW, mais une alerte HIGH (ex.
    // sécurité, deadline) reste légitime même app ouverte.
    if (isRecentlyActive && candidate.template.priority !== "HIGH") {
      recentSessionBlocked = true;
      continue;
    }
    eligible.push(candidate);
  }

  if (eligible.length === 0) {
    // `cooldown` prime sur `recent_session` : le cooldown est une contrainte
    // structurelle du template (et plus stable dans le temps), tandis que la
    // session expire mécaniquement après RECENT_SESSION_HOURS. Remonter la
    // raison la plus "permanente" aide au debug côté observabilité.
    if (cooldownBlocked) {
      return { outcome: "rejected", reason: "cooldown" };
    }
    if (recentSessionBlocked) {
      return { outcome: "rejected", reason: "recent_session" };
    }
    return { outcome: "rejected", reason: "no_candidates" };
  }

  // Argmax manuel en O(n) plutôt qu'un sort O(n log n) : on n'a besoin que du
  // meilleur, jamais d'un classement complet.
  let best = eligible[0];
  if (best === undefined) {
    return { outcome: "rejected", reason: "no_candidates" };
  }
  let bestScore = scoreCandidate(best, stats, now);
  for (let i = 1; i < eligible.length; i += 1) {
    const current = eligible[i];
    // Garde imposée par `noUncheckedIndexedAccess` : l'index est borné par
    // `eligible.length`, donc `current` est en pratique toujours défini.
    if (current === undefined) {
      continue;
    }
    const score = scoreCandidate(current, stats, now);
    if (score > bestScore) {
      best = current;
      bestScore = score;
    }
  }

  return { outcome: "selected", candidate: best, score: bestScore };
};
