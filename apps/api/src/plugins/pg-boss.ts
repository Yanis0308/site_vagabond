import { getPgSslOptions } from "@vagabond/database-client";
import { NOTIFICATION_CRON_TZ } from "@vagabond/shared-utils";
import fp from "fastify-plugin";
import { PgBoss } from "pg-boss";

import { getLogger } from "../utils/logger.js";
import {
  ENRICH_POI_QUEUE,
  registerEnrichPoiWorker,
} from "../workers/enrich-poi.worker.js";
import {
  FIRST_PLACE_PROMPT_CRON,
  FIRST_PLACE_PROMPT_QUEUE,
  registerFirstPlacePromptWorker,
} from "../workers/notifications/first-place-prompt.worker.js";
import {
  INACTIVE_2D_CRON,
  INACTIVE_2D_QUEUE,
  registerInactive2dWorker,
} from "../workers/notifications/inactive-2d.worker.js";
import {
  INACTIVE_7D_CRON,
  INACTIVE_7D_QUEUE,
  registerInactive7dWorker,
} from "../workers/notifications/inactive-7d.worker.js";

declare module "fastify" {
  interface FastifyInstance {
    pgboss: PgBoss;
  }
}

export default fp(
  async (fastify) => {
    const { databaseUrl, isDev } = fastify.config;
    const { schema, enrichmentConcurrency, archiveDays } =
      fastify.config.pgboss;

    const boss = new PgBoss({
      connectionString: databaseUrl,
      ssl: getPgSslOptions(isDev),
      schema,
    });

    boss.on("error", (err): void => {
      getLogger(fastify).error({ err }, "pg-boss error");
    });

    await boss.start();
    fastify.decorate("pgboss", boss);
    getLogger(fastify).info({ schema }, "pg-boss started — queue schema ready");

    // Queues must be created explicitly in v12 before workers attach.
    // `deleteAfterSeconds` définit la rétention des jobs terminés au niveau queue.
    const retentionSeconds = archiveDays * 24 * 60 * 60;

    await boss.createQueue(ENRICH_POI_QUEUE, {
      deleteAfterSeconds: retentionSeconds,
    });
    await registerEnrichPoiWorker(fastify, {
      concurrency: enrichmentConcurrency,
    });

    // Notifications V0 (VG-210/PR5) : 3 crons batch (first_place / inactive_2d
    // / inactive_7d) schedulés en Europe/Paris pour rester cohérents avec
    // `USER_TIMEZONE` côté orchestrateur (quiet hours en heure locale).
    await boss.createQueue(FIRST_PLACE_PROMPT_QUEUE, {
      deleteAfterSeconds: retentionSeconds,
    });
    await boss.createQueue(INACTIVE_2D_QUEUE, {
      deleteAfterSeconds: retentionSeconds,
    });
    await boss.createQueue(INACTIVE_7D_QUEUE, {
      deleteAfterSeconds: retentionSeconds,
    });

    await registerFirstPlacePromptWorker(fastify);
    await registerInactive2dWorker(fastify);
    await registerInactive7dWorker(fastify);

    // Pas de payload : ces jobs n'ont pas de données propres. L'identité par
    // exécution est fournie par pgboss via `job.id` (loggé comme `jobId`).
    await boss.schedule(
      FIRST_PLACE_PROMPT_QUEUE,
      FIRST_PLACE_PROMPT_CRON,
      null,
      {
        tz: NOTIFICATION_CRON_TZ,
      },
    );
    await boss.schedule(INACTIVE_2D_QUEUE, INACTIVE_2D_CRON, null, {
      tz: NOTIFICATION_CRON_TZ,
    });
    await boss.schedule(INACTIVE_7D_QUEUE, INACTIVE_7D_CRON, null, {
      tz: NOTIFICATION_CRON_TZ,
    });

    fastify.addHook("onClose", async (): Promise<void> => {
      getLogger(fastify).info("pg-boss stopping...");
      await boss.stop({ graceful: true });
    });
  },
  {
    name: "pg-boss",
    dependencies: ["custom-config"],
  },
);
