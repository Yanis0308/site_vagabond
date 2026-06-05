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
import { describe, expect, it } from "vitest";

import {
  type OrchestratorCandidate,
  type SelectionContext,
  selectNextNotification,
  type UserNotificationStats,
} from "./notification-orchestrator.service.js";

const HOUR_MS = 60 * 60 * 1000;
const NOW = new Date("2026-03-01T15:00:00.000Z");

const makeTemplate = (
  key: NotificationTemplateKey,
  priority: NotificationPriority,
  cooldownHours: number | null,
): NotificationTemplate => ({
  key,
  channelId: "activity_progression",
  priority,
  cooldownHours,
  deepLink: "vagabond://(app)/(tabs)",
  requiredVariables: [],
  triggerSource: "cron:first_place_prompt",
  variants: [{ title: "t", body: "b" }],
  kpiEvent: "noop",
});

const makeCandidate = (
  template: NotificationTemplate,
  triggerCoords: OrchestratorCandidate["triggerCoords"] = null,
): OrchestratorCandidate => ({
  template,
  variables: {},
  triggerCoords,
});

const baseStats = (): UserNotificationStats => ({
  lastSentAtAcrossAll: null,
  lastSentAtPerTemplate: new Map(),
  countLast24h: 0,
  countLast7d: 0,
  lastSessionAt: null,
});

const baseCtx = (
  overrides: Partial<SelectionContext> = {},
): SelectionContext => ({
  now: NOW,
  // 15h locale Europe/Paris : hors quiet hours par défaut.
  localHour: 15,
  stats: baseStats(),
  ...overrides,
});

describe("selectNextNotification — filtres globaux", () => {
  it("rejette avec cap_day quand countLast24h atteint la limite", () => {
    const ctx = baseCtx({
      stats: { ...baseStats(), countLast24h: MAX_PUSH_PER_DAY },
    });
    const result = selectNextNotification(
      [makeCandidate(makeTemplate("first_place_prompt", "HIGH", null))],
      ctx,
    );
    expect(result).toEqual({ outcome: "rejected", reason: "cap_day" });
  });

  it("rejette avec cap_week quand countLast7d atteint la limite", () => {
    const ctx = baseCtx({
      stats: { ...baseStats(), countLast7d: MAX_PUSH_PER_WEEK },
    });
    const result = selectNextNotification(
      [makeCandidate(makeTemplate("first_place_prompt", "HIGH", null))],
      ctx,
    );
    expect(result).toEqual({ outcome: "rejected", reason: "cap_week" });
  });

  it("cap_day prime sur cap_week, quiet_hours et min_gap", () => {
    const ctx = baseCtx({
      localHour: 23,
      stats: {
        ...baseStats(),
        countLast24h: MAX_PUSH_PER_DAY,
        countLast7d: MAX_PUSH_PER_WEEK,
        lastSentAtAcrossAll: new Date(NOW.getTime() - HOUR_MS),
      },
    });
    const result = selectNextNotification(
      [makeCandidate(makeTemplate("first_place_prompt", "HIGH", null))],
      ctx,
    );
    expect(result).toEqual({ outcome: "rejected", reason: "cap_day" });
  });

  it("rejette avec min_gap si la dernière notif est plus récente que MIN_HOURS_BETWEEN_PUSH", () => {
    const ctx = baseCtx({
      stats: {
        ...baseStats(),
        lastSentAtAcrossAll: new Date(
          NOW.getTime() - (MIN_HOURS_BETWEEN_PUSH - 1) * HOUR_MS,
        ),
      },
    });
    const result = selectNextNotification(
      [makeCandidate(makeTemplate("first_place_prompt", "HIGH", null))],
      ctx,
    );
    expect(result).toEqual({ outcome: "rejected", reason: "min_gap" });
  });

  it("min_gap accepte un gap exactement égal à MIN_HOURS_BETWEEN_PUSH", () => {
    const ctx = baseCtx({
      stats: {
        ...baseStats(),
        lastSentAtAcrossAll: new Date(
          NOW.getTime() - MIN_HOURS_BETWEEN_PUSH * HOUR_MS,
        ),
      },
    });
    const result = selectNextNotification(
      [makeCandidate(makeTemplate("first_place_prompt", "HIGH", null))],
      ctx,
    );
    expect(result.outcome).toBe("selected");
  });
});

describe("selectNextNotification — quiet hours", () => {
  // QUIET_HOURS_START=22, QUIET_HOURS_END=7 → plage qui traverse minuit.
  it("bloque pile à QUIET_HOURS_START (inclusif)", () => {
    const ctx = baseCtx({ localHour: QUIET_HOURS_START });
    const result = selectNextNotification(
      [makeCandidate(makeTemplate("first_place_prompt", "HIGH", null))],
      ctx,
    );
    expect(result).toEqual({ outcome: "rejected", reason: "quiet_hours" });
  });

  it("bloque au cœur de la nuit (après minuit)", () => {
    const ctx = baseCtx({ localHour: 2 });
    const result = selectNextNotification(
      [makeCandidate(makeTemplate("first_place_prompt", "HIGH", null))],
      ctx,
    );
    expect(result).toEqual({ outcome: "rejected", reason: "quiet_hours" });
  });

  it("accepte pile à QUIET_HOURS_END (exclusif)", () => {
    const ctx = baseCtx({ localHour: QUIET_HOURS_END });
    const result = selectNextNotification(
      [makeCandidate(makeTemplate("first_place_prompt", "HIGH", null))],
      ctx,
    );
    expect(result.outcome).toBe("selected");
  });

  it("accepte juste avant QUIET_HOURS_START", () => {
    const ctx = baseCtx({ localHour: QUIET_HOURS_START - 1 });
    const result = selectNextNotification(
      [makeCandidate(makeTemplate("first_place_prompt", "HIGH", null))],
      ctx,
    );
    expect(result.outcome).toBe("selected");
  });
});

describe("selectNextNotification — cooldown par template", () => {
  it("cooldownHours=null bloque dès qu'un envoi précédent existe (unique en vie)", () => {
    const template = makeTemplate("first_place_prompt", "HIGH", null);
    const ctx = baseCtx({
      stats: {
        ...baseStats(),
        lastSentAtPerTemplate: new Map([
          // Très ancien : confirme que `null` ignore la fraîcheur.
          [template.key, new Date(NOW.getTime() - 365 * 24 * HOUR_MS)],
        ]),
      },
    });
    const result = selectNextNotification([makeCandidate(template)], ctx);
    expect(result).toEqual({ outcome: "rejected", reason: "cooldown" });
  });

  it("cooldownHours=null accepte si jamais envoyé", () => {
    const template = makeTemplate("first_place_prompt", "HIGH", null);
    const result = selectNextNotification([makeCandidate(template)], baseCtx());
    expect(result.outcome).toBe("selected");
  });

  it("bloque si lastSent < cooldownHours", () => {
    const template = makeTemplate("inactive_7d", "HIGH", 24);
    const ctx = baseCtx({
      stats: {
        ...baseStats(),
        lastSentAtPerTemplate: new Map([
          [template.key, new Date(NOW.getTime() - 23 * HOUR_MS)],
        ]),
      },
    });
    const result = selectNextNotification([makeCandidate(template)], ctx);
    expect(result).toEqual({ outcome: "rejected", reason: "cooldown" });
  });

  it("accepte si lastSent = cooldownHours pile (limite inclusive)", () => {
    const template = makeTemplate("inactive_7d", "HIGH", 24);
    const ctx = baseCtx({
      stats: {
        ...baseStats(),
        lastSentAtPerTemplate: new Map([
          [template.key, new Date(NOW.getTime() - 24 * HOUR_MS)],
        ]),
      },
    });
    const result = selectNextNotification([makeCandidate(template)], ctx);
    expect(result.outcome).toBe("selected");
  });
});

describe("selectNextNotification — recent session & bypass HIGH", () => {
  it("bloque un candidat non-HIGH si l'utilisateur a une session récente", () => {
    const ctx = baseCtx({
      stats: {
        ...baseStats(),
        lastSessionAt: new Date(NOW.getTime() - HOUR_MS),
      },
    });
    const result = selectNextNotification(
      [makeCandidate(makeTemplate("inactive_2d", "MEDIUM", 24))],
      ctx,
    );
    expect(result).toEqual({ outcome: "rejected", reason: "recent_session" });
  });

  it("laisse passer un candidat HIGH malgré une session récente", () => {
    const ctx = baseCtx({
      stats: {
        ...baseStats(),
        lastSessionAt: new Date(NOW.getTime() - HOUR_MS),
      },
    });
    const result = selectNextNotification(
      [makeCandidate(makeTemplate("first_place_prompt", "HIGH", null))],
      ctx,
    );
    expect(result.outcome).toBe("selected");
  });

  it("ignore une session plus vieille que RECENT_SESSION_HOURS", () => {
    const ctx = baseCtx({
      stats: {
        ...baseStats(),
        lastSessionAt: new Date(
          NOW.getTime() - (RECENT_SESSION_HOURS + 1) * HOUR_MS,
        ),
      },
    });
    const result = selectNextNotification(
      [makeCandidate(makeTemplate("inactive_2d", "MEDIUM", 24))],
      ctx,
    );
    expect(result.outcome).toBe("selected");
  });
});

describe("selectNextNotification — priorité de la raison de rejet", () => {
  it("renvoie `cooldown` plutôt que `recent_session` quand les deux raisons s'appliquent", () => {
    const cooldownTemplate = makeTemplate("inactive_7d", "MEDIUM", 24);
    const sessionTemplate = makeTemplate("inactive_2d", "MEDIUM", 24);
    const ctx = baseCtx({
      stats: {
        ...baseStats(),
        lastSessionAt: new Date(NOW.getTime() - HOUR_MS),
        lastSentAtPerTemplate: new Map([
          [cooldownTemplate.key, new Date(NOW.getTime() - HOUR_MS)],
        ]),
      },
    });
    const result = selectNextNotification(
      [makeCandidate(cooldownTemplate), makeCandidate(sessionTemplate)],
      ctx,
    );
    expect(result).toEqual({ outcome: "rejected", reason: "cooldown" });
  });
});

describe("selectNextNotification — argmax", () => {
  it("HIGH éligible bat MEDIUM éligible peu importe la récence", () => {
    // MEDIUM jamais envoyé → recencyBonus max (1) → score 6.
    // HIGH envoyé il y a 1h → recencyBonus ≈ 1/168 → score ~10.006.
    // Garantie : écart entre tiers > 1, donc HIGH gagne toujours.
    const high = makeTemplate("first_place_prompt", "HIGH", 24);
    const medium = makeTemplate("inactive_2d", "MEDIUM", 24);
    const ctx = baseCtx({
      stats: {
        ...baseStats(),
        lastSentAtPerTemplate: new Map([
          [high.key, new Date(NOW.getTime() - 25 * HOUR_MS)],
        ]),
      },
    });
    const result = selectNextNotification(
      [makeCandidate(medium), makeCandidate(high)],
      ctx,
    );
    expect(result.outcome).toBe("selected");
    if (result.outcome === "selected") {
      expect(result.candidate.template.key).toBe(high.key);
    }
  });

  it("entre deux templates de même priorité, celui jamais envoyé bat le récent", () => {
    const freshHigh = makeTemplate("first_place_prompt", "HIGH", 24);
    const recentHigh = makeTemplate("inactive_7d", "HIGH", 24);
    const ctx = baseCtx({
      stats: {
        ...baseStats(),
        lastSentAtPerTemplate: new Map([
          // 25h ago : passe le cooldown (24h), mais recencyBonus faible.
          [recentHigh.key, new Date(NOW.getTime() - 25 * HOUR_MS)],
        ]),
      },
    });
    const result = selectNextNotification(
      [makeCandidate(recentHigh), makeCandidate(freshHigh)],
      ctx,
    );
    expect(result.outcome).toBe("selected");
    if (result.outcome === "selected") {
      expect(result.candidate.template.key).toBe(freshHigh.key);
    }
  });

  it("renvoie le score et le candidat sélectionné pour un seul candidat HIGH", () => {
    const template = makeTemplate("first_place_prompt", "HIGH", 24);
    const result = selectNextNotification([makeCandidate(template)], baseCtx());
    expect(result.outcome).toBe("selected");
    if (result.outcome === "selected") {
      // PRIORITY_WEIGHT.HIGH (10) + recencyBonus (1 quand jamais envoyé) = 11.
      expect(result.score).toBe(11);
      expect(result.candidate.template.key).toBe(template.key);
    }
  });
});

describe("selectNextNotification — edges", () => {
  it("renvoie no_candidates quand la liste est vide", () => {
    const result = selectNextNotification([], baseCtx());
    expect(result).toEqual({ outcome: "rejected", reason: "no_candidates" });
  });

  it("préserve les triggerCoords du candidat sélectionné", () => {
    const template = makeTemplate("inactive_7d", "HIGH", 24);
    const coords = { latitude: 48.8566, longitude: 2.3522 };
    const result = selectNextNotification(
      [makeCandidate(template, coords)],
      baseCtx(),
    );
    expect(result.outcome).toBe("selected");
    if (result.outcome === "selected") {
      expect(result.candidate.triggerCoords).toEqual(coords);
    }
  });
});
