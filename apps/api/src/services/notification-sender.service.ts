import { randomUUID } from "node:crypto";

import { type ActivePushDevice } from "@vagabond/database-client";
import { type RenderedTemplate, renderTemplate } from "@vagabond/shared-utils";
import { type FastifyInstance } from "fastify";
import { type FirebaseError } from "firebase-admin/app";
import { getMessaging, type Message } from "firebase-admin/messaging";

import { captureAndLog, getLogger } from "../utils/logger.js";
import { type OrchestratorCandidate } from "./notification-orchestrator.service.js";

/**
 * FCM error codes that indicate the token is permanently dead and the device
 * should be disabled. Other errors (rate limits, transient network) are kept
 * active and retried on the next cron tick.
 */
const DEAD_TOKEN_CODES = new Set<string>([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

/**
 * FCM/firebase-admin error codes meaning "token bucket exhausted at project
 * level" (HTTP 429 RESOURCE_EXHAUSTED). When seen, the dispatch batch should
 * short-circuit instead of grilling the remaining candidates — the bucket
 * refills minute-by-minute and the next cron tick will retry.
 */
const QUOTA_EXCEEDED_CODES = new Set<string>([
  "messaging/message-rate-exceeded",
]);

export interface SendNotificationInput {
  userId: string;
  candidate: OrchestratorCandidate;
  variantIndex: number;
}

export type SendNotificationOutcome =
  | {
      status: "sent";
      notificationId: string;
      deliveredTo: number;
      rateLimited: boolean;
    }
  | {
      status: "failed";
      notificationId: string;
      reason: string;
      rateLimited: boolean;
    }
  | { status: "skipped"; reason: "render_failed" | "no_active_devices" };

interface DeviceSendResult {
  device: ActivePushDevice;
  ok: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  errorInfo: unknown;
}

const buildFcmMessage = (
  device: ActivePushDevice,
  rendered: RenderedTemplate,
  notificationId: string,
  templateKey: string,
): Message => {
  // Mapping plateforme aligné avec la priorité métier du template.
  // - APNs: 10 = immediate, 5 = power-aware (1 réservé aux silent pushes).
  // - Android: "high" = wake immédiat (rate-limité par Google si abusé sur du
  //   trafic peu urgent), "normal" = différable jusqu'au prochain réveil.
  const androidPriority: "high" | "normal" =
    rendered.priority === "LOW" ? "normal" : "high";
  const apnsPriority = rendered.priority === "HIGH" ? "10" : "5";
  return {
    token: device.token,
    notification: {
      title: rendered.title,
      body: rendered.body,
    },
    android: {
      priority: androidPriority,
      notification: {
        channelId: rendered.channelId,
      },
    },
    apns: {
      headers: { "apns-priority": apnsPriority },
      payload: {
        aps: {
          sound: "default",
          "mutable-content": 1,
        },
      },
    },
    data: {
      notificationId,
      templateKey,
      deepLink: rendered.deepLink,
      channelId: rendered.channelId,
      priority: rendered.priority,
    },
  };
};

// `FirebaseError` (public, depuis `firebase-admin/app`) couvre `code` et
// `message`. `errorInfo` est privé côté SDK donc non exposé par le type — on
// le garde en accès non typé, c'est un best-effort de debug.
const isFirebaseError = (error: unknown): error is FirebaseError =>
  error instanceof Error &&
  typeof (error as Partial<FirebaseError>).code === "string";

const sendToDevice = async (
  device: ActivePushDevice,
  message: Message,
): Promise<DeviceSendResult> => {
  try {
    await getMessaging().send(message);
    return {
      device,
      ok: true,
      errorCode: null,
      errorMessage: null,
      errorInfo: null,
    };
  } catch (error) {
    const code = isFirebaseError(error) ? error.code : "unknown";
    const message = error instanceof Error ? error.message : String(error);
    // firebase-admin attache souvent `errorInfo` (FirebaseError) ou `cause`
    // (FCMRequestError) avec le payload renvoyé par APNs/FCM (raison APNs,
    // statut HTTP, bundle id, etc.). On les remonte pour diagnostiquer
    // les third-party-auth-error / mismatchs sandbox/prod.
    const errorInfo =
      error instanceof Error
        ? ((error as Error & { errorInfo?: unknown }).errorInfo ??
          error.cause ??
          null)
        : null;
    return {
      device,
      ok: false,
      errorCode: code,
      errorMessage: message,
      errorInfo,
    };
  }
};

/**
 * Sends a single notification to every active device of `userId`, then writes
 * exactly one `notification_events` row recording the outcome.
 *
 * - Per-notification (not per-device) row: status="sent" if at least one
 *   device received it, otherwise "failed".
 * - Tokens returning a permanently-dead FCM error are marked
 *   `push_devices.disabled_at = now()` so they stop being targeted.
 * - Variant is selected deterministically from `variantIndex` (caller passes
 *   `countSentForTemplate(userId, templateKey)`).
 */
export const sendNotification = async (
  fastify: FastifyInstance,
  input: SendNotificationInput,
): Promise<SendNotificationOutcome> => {
  const { candidate, userId, variantIndex } = input;
  const { template } = candidate;
  const log = getLogger(fastify);

  const rendered = renderTemplate(
    template.key,
    candidate.variables,
    variantIndex,
  );
  if (rendered === null) {
    // Render failure = code/data bug (template cassé, variable manquante,
    // variantIndex hors borne). On écrit une row `failed` pour conserver
    // l'audit trail et on signale Sentry pour fixer en review.
    const notificationId = randomUUID();
    const sentAt = new Date();
    await fastify.dbRepositories.notificationEvent.insert({
      notificationId,
      userId,
      templateKey: template.key,
      channelId: template.channelId,
      priority: template.priority,
      titleRendered: "",
      bodyRendered: "",
      variantIndex,
      deepLink: template.deepLink,
      status: "failed",
      failureReason: "render_failed",
      sentAt,
      triggerSource: template.triggerSource,
      triggerCoords: candidate.triggerCoords,
    });
    captureAndLog(
      fastify,
      new Error(`renderTemplate returned null for ${template.key}`),
      "Notification render failed",
      {
        level: "warning",
        tags: { operation: "notification-render" },
        extra: {
          userId,
          templateKey: template.key,
          variantIndex,
          variables: candidate.variables,
        },
      },
    );
    return { status: "skipped", reason: "render_failed" };
  }

  const notificationId = randomUUID();
  const sentAt = new Date();

  const devices =
    await fastify.dbRepositories.pushDevice.listActiveByUser(userId);

  if (devices.length === 0) {
    await fastify.dbRepositories.notificationEvent.insert({
      notificationId,
      userId,
      templateKey: template.key,
      channelId: rendered.channelId,
      priority: rendered.priority,
      titleRendered: rendered.title,
      bodyRendered: rendered.body,
      variantIndex,
      deepLink: rendered.deepLink,
      status: "failed",
      failureReason: "no_active_devices",
      sentAt,
      triggerSource: template.triggerSource,
      triggerCoords: candidate.triggerCoords,
    });
    return { status: "skipped", reason: "no_active_devices" };
  }

  const results = await Promise.all(
    devices.map((device) =>
      sendToDevice(
        device,
        buildFcmMessage(device, rendered, notificationId, template.key),
      ),
    ),
  );

  const deadTokens: string[] = [];
  let successes = 0;
  const failureCodes: string[] = [];
  const failures: Array<{
    deviceId: number;
    platform: string;
    tokenPrefix: string;
    code: string | null;
    message: string | null;
    info: unknown;
  }> = [];
  for (const result of results) {
    if (result.ok) {
      successes += 1;
      continue;
    }
    if (result.errorCode !== null) {
      failureCodes.push(result.errorCode);
      if (DEAD_TOKEN_CODES.has(result.errorCode)) {
        deadTokens.push(result.device.token);
      }
    }
    failures.push({
      deviceId: result.device.id,
      platform: result.device.platform,
      tokenPrefix: result.device.token.slice(0, 12),
      code: result.errorCode,
      message: result.errorMessage,
      info: result.errorInfo,
    });
  }

  if (deadTokens.length > 0) {
    await Promise.all(
      deadTokens.map(async (token) => {
        try {
          await fastify.dbRepositories.pushDevice.markDisabledByToken(token);
        } catch (error) {
          captureAndLog(fastify, error, "Failed to disable dead push token", {
            level: "warning",
            tags: { operation: "push-token-cleanup" },
          });
        }
      }),
    );
  }

  const status: "sent" | "failed" = successes > 0 ? "sent" : "failed";
  let failureReason: string | null = null;
  if (status === "failed") {
    const joined = failureCodes.join(",").slice(0, 500);
    failureReason = joined === "" ? "all_devices_failed" : joined;
  }
  const rateLimited = failureCodes.some((code) =>
    QUOTA_EXCEEDED_CODES.has(code),
  );

  await fastify.dbRepositories.notificationEvent.insert({
    notificationId,
    userId,
    templateKey: template.key,
    channelId: rendered.channelId,
    priority: rendered.priority,
    titleRendered: rendered.title,
    bodyRendered: rendered.body,
    variantIndex,
    deepLink: rendered.deepLink,
    status,
    failureReason,
    sentAt,
    triggerSource: template.triggerSource,
    triggerCoords: candidate.triggerCoords,
  });

  if (status === "sent") {
    log.info(
      {
        userId,
        notificationId,
        templateKey: template.key,
        deliveredTo: successes,
        totalDevices: devices.length,
        deadTokensCleaned: deadTokens.length,
        rateLimited,
      },
      "notification_sent",
    );
    return {
      status: "sent",
      notificationId,
      deliveredTo: successes,
      rateLimited,
    };
  }

  log.warn(
    {
      userId,
      notificationId,
      templateKey: template.key,
      totalDevices: devices.length,
      failureCodes,
      failures,
      rateLimited,
    },
    "notification_failed",
  );
  return {
    status: "failed",
    notificationId,
    reason: failureReason ?? "all_devices_failed",
    rateLimited,
  };
};
