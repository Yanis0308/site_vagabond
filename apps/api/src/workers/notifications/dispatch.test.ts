import {
  MAX_PUSH_PER_DAY,
  NOTIFICATION_TEMPLATES,
} from "@vagabond/shared-utils";
import { type FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type OrchestratorCandidate } from "../../services/notification-orchestrator.service.js";
import { type SendNotificationOutcome } from "../../services/notification-sender.service.js";
import {
  dispatchNotificationForUser,
  dispatchNotificationsForUsers,
  localHourFor,
} from "./dispatch.js";

const sendNotificationMock = vi.hoisted(() =>
  vi.fn<
    (
      fastify: FastifyInstance,
      input: {
        userId: string;
        candidate: OrchestratorCandidate;
        variantIndex: number;
      },
    ) => Promise<SendNotificationOutcome>
  >(),
);

vi.mock("../../services/notification-sender.service.js", () => ({
  sendNotification: sendNotificationMock,
}));

const buildCandidate = (): OrchestratorCandidate => ({
  template: NOTIFICATION_TEMPLATES.first_place_prompt,
  variables: {},
  triggerCoords: null,
});

interface NotificationEventRepoStub {
  countSinceForUser: ReturnType<typeof vi.fn>;
  getLastSentAtForUser: ReturnType<typeof vi.fn>;
  getLastSentAtForTemplate: ReturnType<typeof vi.fn>;
  countSentForTemplate: ReturnType<typeof vi.fn>;
}

const buildFastify = (): {
  fastify: FastifyInstance;
  repo: NotificationEventRepoStub;
  log: { info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn> };
} => {
  const repo: NotificationEventRepoStub = {
    countSinceForUser: vi.fn().mockResolvedValue(0),
    getLastSentAtForUser: vi.fn().mockResolvedValue(null),
    getLastSentAtForTemplate: vi.fn().mockResolvedValue(null),
    countSentForTemplate: vi.fn().mockResolvedValue(0),
  };
  const log = { info: vi.fn(), warn: vi.fn() };
  const fastify = {
    log,
    dbRepositories: { notificationEvent: repo },
  } as unknown as FastifyInstance;
  return { fastify, repo, log };
};

// Hors quiet hours [22h, 7h) Paris : juin 2026 → CEST (UTC+2), 10:00 UTC = 12h Paris.
const NOW_DAYTIME = new Date("2026-06-02T10:00:00.000Z");

describe("localHourFor", () => {
  it("converts UTC midnight to 1h Paris during winter (CET, UTC+1)", () => {
    expect(
      localHourFor(new Date("2026-01-01T00:00:00.000Z"), "Europe/Paris"),
    ).toBe(1);
  });

  it("converts UTC midnight to 2h Paris during summer (CEST, UTC+2)", () => {
    expect(
      localHourFor(new Date("2026-06-01T00:00:00.000Z"), "Europe/Paris"),
    ).toBe(2);
  });

  it("uses h23 cycle: midnight is hour 0, not 24", () => {
    // 23h UTC + 1h winter offset = 24 in h24, must be 0 in h23.
    expect(
      localHourFor(new Date("2026-01-01T23:00:00.000Z"), "Europe/Paris"),
    ).toBe(0);
  });

  it("returns an hour in 0..23 across the full day", () => {
    for (let h = 0; h < 24; h += 1) {
      const utc = new Date(Date.UTC(2026, 0, 1, h, 0, 0));
      const out = localHourFor(utc, "Europe/Paris");
      expect(out).toBeGreaterThanOrEqual(0);
      expect(out).toBeLessThanOrEqual(23);
    }
  });
});

describe("dispatchNotificationForUser", () => {
  beforeEach(() => {
    sendNotificationMock.mockReset();
  });

  it("rejects early with no_candidates when the input list is empty", async () => {
    const { fastify, repo } = buildFastify();
    const outcome = await dispatchNotificationForUser(fastify, {
      userId: "u1",
      candidates: [],
      now: NOW_DAYTIME,
    });
    expect(outcome).toEqual({
      userId: "u1",
      result: "rejected",
      reason: "no_candidates",
    });
    expect(repo.countSinceForUser).not.toHaveBeenCalled();
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });

  it("propagates the orchestrator rejection reason (e.g. cap_day)", async () => {
    const { fastify, repo } = buildFastify();
    repo.countSinceForUser.mockResolvedValue(MAX_PUSH_PER_DAY);
    const outcome = await dispatchNotificationForUser(fastify, {
      userId: "u1",
      candidates: [buildCandidate()],
      now: NOW_DAYTIME,
    });
    expect(outcome.result).toBe("rejected");
    expect(outcome.reason).toBe("cap_day");
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });

  it("returns sent with notificationId + rateLimited when the sender succeeds", async () => {
    const { fastify, repo } = buildFastify();
    repo.countSentForTemplate.mockResolvedValue(3);
    sendNotificationMock.mockResolvedValue({
      status: "sent",
      notificationId: "n-42",
      deliveredTo: 2,
      rateLimited: false,
    });

    const outcome = await dispatchNotificationForUser(fastify, {
      userId: "u1",
      candidates: [buildCandidate()],
      now: NOW_DAYTIME,
    });

    expect(outcome).toEqual({
      userId: "u1",
      result: "sent",
      templateKey: "first_place_prompt",
      notificationId: "n-42",
      rateLimited: false,
    });
    expect(sendNotificationMock).toHaveBeenCalledTimes(1);
    const [, senderArgs] = sendNotificationMock.mock.calls[0] ?? [];
    expect(senderArgs?.userId).toBe("u1");
    expect(senderArgs?.variantIndex).toBe(3);
    expect(senderArgs?.candidate.template).toBe(
      NOTIFICATION_TEMPLATES.first_place_prompt,
    );
  });

  it("propagates rateLimited=true from the sender", async () => {
    const { fastify } = buildFastify();
    sendNotificationMock.mockResolvedValue({
      status: "sent",
      notificationId: "n-1",
      deliveredTo: 1,
      rateLimited: true,
    });

    const outcome = await dispatchNotificationForUser(fastify, {
      userId: "u1",
      candidates: [buildCandidate()],
      now: NOW_DAYTIME,
    });

    expect(outcome.rateLimited).toBe(true);
  });

  it("returns failed with reason and rateLimited when the sender fails", async () => {
    const { fastify } = buildFastify();
    sendNotificationMock.mockResolvedValue({
      status: "failed",
      notificationId: "n-2",
      reason: "messaging/internal-error",
      rateLimited: false,
    });

    const outcome = await dispatchNotificationForUser(fastify, {
      userId: "u1",
      candidates: [buildCandidate()],
      now: NOW_DAYTIME,
    });

    expect(outcome).toEqual({
      userId: "u1",
      result: "failed",
      templateKey: "first_place_prompt",
      notificationId: "n-2",
      reason: "messaging/internal-error",
      rateLimited: false,
    });
  });

  it("maps skipped sender outcomes to the matching result enum value", async () => {
    const { fastify } = buildFastify();
    sendNotificationMock.mockResolvedValue({
      status: "skipped",
      reason: "render_failed",
    });

    const outcome = await dispatchNotificationForUser(fastify, {
      userId: "u1",
      candidates: [buildCandidate()],
      now: NOW_DAYTIME,
    });

    expect(outcome).toEqual({
      userId: "u1",
      result: "render_failed",
      templateKey: "first_place_prompt",
    });
  });
});

describe("dispatchNotificationsForUsers", () => {
  beforeEach(() => {
    sendNotificationMock.mockReset();
  });

  it("short-circuits remaining inputs once one task reports rateLimited", async () => {
    const { fastify, log } = buildFastify();
    // Concurrency 1 → tasks run strictly sequentially, making the short-circuit
    // race-free for assertion purposes.
    sendNotificationMock
      .mockResolvedValueOnce({
        status: "sent",
        notificationId: "n-1",
        deliveredTo: 1,
        rateLimited: true,
      })
      // These must NOT be called: the second/third inputs should hit the
      // short-circuit branch before reaching the sender.
      .mockRejectedValue(
        new Error(
          "sender must not be called after short-circuit triggers — quotaExceeded flag is not propagating",
        ),
      );

    const outcomes = await dispatchNotificationsForUsers(
      fastify,
      [
        { userId: "u1", candidates: [buildCandidate()] },
        { userId: "u2", candidates: [buildCandidate()] },
        { userId: "u3", candidates: [buildCandidate()] },
      ],
      { now: NOW_DAYTIME, concurrency: 1 },
    );

    expect(sendNotificationMock).toHaveBeenCalledTimes(1);
    expect(outcomes).toHaveLength(3);
    expect(outcomes[0]).toMatchObject({
      userId: "u1",
      result: "sent",
      rateLimited: true,
    });
    expect(outcomes[1]).toEqual({
      userId: "u2",
      result: "quota_exceeded",
      reason: "batch_short_circuit",
    });
    expect(outcomes[2]).toEqual({
      userId: "u3",
      result: "quota_exceeded",
      reason: "batch_short_circuit",
    });
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        templateKey: "first_place_prompt",
      }),
      "notification_dispatch_quota_exceeded_short_circuit",
    );
  });

  it("processes every input when no task is rate-limited", async () => {
    const { fastify, log } = buildFastify();
    sendNotificationMock.mockResolvedValue({
      status: "sent",
      notificationId: "n-x",
      deliveredTo: 1,
      rateLimited: false,
    });

    const outcomes = await dispatchNotificationsForUsers(
      fastify,
      [
        { userId: "u1", candidates: [buildCandidate()] },
        { userId: "u2", candidates: [buildCandidate()] },
      ],
      { now: NOW_DAYTIME, concurrency: 1 },
    );

    expect(sendNotificationMock).toHaveBeenCalledTimes(2);
    expect(outcomes.every((o) => o.result === "sent")).toBe(true);
    expect(log.warn).not.toHaveBeenCalled();
  });

  it("returns an empty array when given no inputs", async () => {
    const { fastify } = buildFastify();
    const outcomes = await dispatchNotificationsForUsers(fastify, [], {
      now: NOW_DAYTIME,
    });
    expect(outcomes).toEqual([]);
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });
});
