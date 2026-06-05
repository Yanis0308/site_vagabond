import { type ActivePushDevice } from "@vagabond/database-client";
import {
  NOTIFICATION_TEMPLATES,
  type NotificationTemplateKey,
} from "@vagabond/shared-utils";
import { type FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type OrchestratorCandidate } from "./notification-orchestrator.service.js";
import { sendNotification } from "./notification-sender.service.js";

const fcmSendMock = vi.hoisted(() => vi.fn());

vi.mock("firebase-admin/messaging", () => ({
  getMessaging: (): { send: typeof fcmSendMock } => ({ send: fcmSendMock }),
}));

vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
}));

const buildCandidate = (): OrchestratorCandidate => ({
  template: NOTIFICATION_TEMPLATES.first_place_prompt,
  variables: {},
  triggerCoords: null,
});

const buildDevice = (
  overrides: Partial<ActivePushDevice> = {},
): ActivePushDevice => ({
  id: 1,
  token: "fake-fcm-token-aaaaaaaaaaaaaaaa",
  platform: "ios",
  ...overrides,
});

interface SenderFastifyStubs {
  fastify: FastifyInstance;
  notificationEventInsert: ReturnType<typeof vi.fn>;
  listActiveByUser: ReturnType<typeof vi.fn>;
  markDisabledByToken: ReturnType<typeof vi.fn>;
}

const buildFastify = (devices: ActivePushDevice[]): SenderFastifyStubs => {
  const notificationEventInsert = vi.fn().mockResolvedValue(undefined);
  const listActiveByUser = vi.fn().mockResolvedValue(devices);
  const markDisabledByToken = vi.fn().mockResolvedValue(undefined);
  const fastify = {
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    dbRepositories: {
      notificationEvent: { insert: notificationEventInsert },
      pushDevice: { listActiveByUser, markDisabledByToken },
    },
  } as unknown as FastifyInstance;
  return {
    fastify,
    notificationEventInsert,
    listActiveByUser,
    markDisabledByToken,
  };
};

const fcmError = (code: string): Error & { code: string } => {
  const err = new Error(code) as Error & { code: string };
  err.code = code;
  return err;
};

describe("sendNotification — rateLimited propagation (PR5 delta)", () => {
  beforeEach(() => {
    fcmSendMock.mockReset();
  });

  it("returns rateLimited=false when every device send succeeds", async () => {
    const { fastify, notificationEventInsert } = buildFastify([buildDevice()]);
    fcmSendMock.mockResolvedValue("messages/123");

    const outcome = await sendNotification(fastify, {
      userId: "u1",
      candidate: buildCandidate(),
      variantIndex: 0,
    });

    expect(outcome.status).toBe("sent");
    if (outcome.status !== "sent") return;
    expect(outcome.rateLimited).toBe(false);
    expect(outcome.deliveredTo).toBe(1);
    expect(notificationEventInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "sent" }),
    );
  });

  it("returns rateLimited=true when the only device hits messaging/message-rate-exceeded", async () => {
    const { fastify, notificationEventInsert, markDisabledByToken } =
      buildFastify([buildDevice()]);
    fcmSendMock.mockRejectedValue(fcmError("messaging/message-rate-exceeded"));

    const outcome = await sendNotification(fastify, {
      userId: "u1",
      candidate: buildCandidate(),
      variantIndex: 0,
    });

    expect(outcome.status).toBe("failed");
    if (outcome.status !== "failed") return;
    expect(outcome.rateLimited).toBe(true);
    expect(outcome.reason).toContain("messaging/message-rate-exceeded");
    const insertedRow = notificationEventInsert.mock.calls[0]?.[0] as {
      status: string;
      failureReason: string;
    };
    expect(insertedRow.status).toBe("failed");
    expect(insertedRow.failureReason).toContain(
      "messaging/message-rate-exceeded",
    );
    // 429 ≠ dead token: the device must stay active for the next cron tick.
    expect(markDisabledByToken).not.toHaveBeenCalled();
  });

  it("returns sent + rateLimited=true when one device succeeds and another hits 429", async () => {
    const deviceA = buildDevice({ id: 1, token: "tok-A-aaaaaaaaaaaaaaaa" });
    const deviceB = buildDevice({
      id: 2,
      token: "tok-B-bbbbbbbbbbbbbbbb",
      platform: "android",
    });
    const { fastify } = buildFastify([deviceA, deviceB]);
    fcmSendMock.mockImplementation((msg: { token: string }) => {
      if (msg.token === deviceA.token) {
        return Promise.resolve("messages/ok");
      }
      return Promise.reject(fcmError("messaging/message-rate-exceeded"));
    });

    const outcome = await sendNotification(fastify, {
      userId: "u1",
      candidate: buildCandidate(),
      variantIndex: 0,
    });

    expect(outcome.status).toBe("sent");
    if (outcome.status !== "sent") return;
    expect(outcome.rateLimited).toBe(true);
    expect(outcome.deliveredTo).toBe(1);
  });

  it("does not flag rateLimited for unrelated failures (e.g. dead token)", async () => {
    const { fastify, markDisabledByToken } = buildFastify([buildDevice()]);
    fcmSendMock.mockRejectedValue(
      fcmError("messaging/registration-token-not-registered"),
    );

    const outcome = await sendNotification(fastify, {
      userId: "u1",
      candidate: buildCandidate(),
      variantIndex: 0,
    });

    expect(outcome.status).toBe("failed");
    if (outcome.status !== "failed") return;
    expect(outcome.rateLimited).toBe(false);
    // Dead-token cleanup still runs unchanged.
    expect(markDisabledByToken).toHaveBeenCalledWith(
      "fake-fcm-token-aaaaaaaaaaaaaaaa",
    );
  });

  it("excludes placeholder/skipped paths from the rateLimited field (no FCM call)", async () => {
    const { fastify } = buildFastify([]);
    const outcome = await sendNotification(fastify, {
      userId: "u1",
      candidate: buildCandidate(),
      variantIndex: 0,
    });
    expect(outcome.status).toBe("skipped");
    expect(fcmSendMock).not.toHaveBeenCalled();
    // The `skipped` variant intentionally has no `rateLimited` field — assert
    // its absence so a future widening of the shape stays deliberate.
    expect("rateLimited" in outcome).toBe(false);
  });

  it("compiles against the public NotificationTemplateKey union", () => {
    const key: NotificationTemplateKey =
      NOTIFICATION_TEMPLATES.first_place_prompt.key;
    expect(typeof key).toBe("string");
  });
});
