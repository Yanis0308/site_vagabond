import type { FastifyInstance } from "fastify";

import { getLogger } from "../utils/logger.js";

export const ENRICH_POI_QUEUE = "enrich-poi";

export interface EnrichPoiJobData {
  poiId: string;
  batchId?: string;
  force?: boolean;
  reason?: string;
}

/**
 * Register the `enrich-poi` queue handler.
 *
 * Phase B : stub qui log juste la réception du job. Le pipeline §4
 * (Jina → distillation → génération → sélection images) viendra en Phase D.
 *
 * La queue doit être créée (`boss.createQueue`) avant d'attacher ce handler —
 * le plugin s'en charge avant l'appel à cette fonction.
 */
export async function registerEnrichPoiWorker(
  fastify: FastifyInstance,
  options: { concurrency: number },
): Promise<void> {
  await fastify.pgboss.work<EnrichPoiJobData>(
    ENRICH_POI_QUEUE,
    {
      localConcurrency: options.concurrency,
      pollingIntervalSeconds: 2,
    },
    (jobs): Promise<void> => {
      for (const job of jobs) {
        getLogger(fastify).info(
          {
            jobId: job.id,
            poiId: job.data.poiId,
            batchId: job.data.batchId,
            force: job.data.force,
            reason: job.data.reason,
          },
          "enrich-poi job received (Phase B stub — no-op)",
        );
        // Phase C/D : brancher ici PoiEnrichmentServiceV2.process(job.data)
      }
      return Promise.resolve();
    },
  );

  getLogger(fastify).info(
    { queue: ENRICH_POI_QUEUE, concurrency: options.concurrency },
    "enrich-poi worker registered",
  );
}
