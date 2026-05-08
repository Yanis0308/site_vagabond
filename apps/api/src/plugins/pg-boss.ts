import { getPgSslOptions } from "@vagabond/database-client";
import fp from "fastify-plugin";
import { PgBoss } from "pg-boss";

import { getLogger } from "../utils/logger.js";
import {
  ENRICH_POI_QUEUE,
  registerEnrichPoiWorker,
} from "../workers/enrich-poi.worker.js";

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
    await boss.createQueue(ENRICH_POI_QUEUE, {
      deleteAfterSeconds: archiveDays * 24 * 60 * 60,
    });

    await registerEnrichPoiWorker(fastify, {
      concurrency: enrichmentConcurrency,
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
