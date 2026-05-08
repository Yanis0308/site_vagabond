import type { FastifyInstance } from "fastify";

import {
  ENRICH_POI_QUEUE,
  type EnrichPoiJobData,
} from "./enrich-poi.worker.js";

export interface EnqueueOptions {
  batchId?: string;
  reason?: string;
  force?: boolean;
  priority?: number;
}

export interface EnqueueResult {
  batchId: string;
  enqueued: number;
  skipped: number;
}

/**
 * Enqueue POIs pour enrichissement via pg-boss.
 *
 * Dédup automatique via `singletonKey = poiId` : si un job pour un POI donné
 * est déjà en file ou en cours, l'insert est ignoré (compté dans `skipped`).
 *
 * Signature v12 : `insert(queueName, jobs[], options?)`. Les options par job
 * (retry, singletonKey, priority...) sont à plat sur chaque élément.
 */
export async function enqueuePois(
  fastify: FastifyInstance,
  poiIds: string[],
  options: EnqueueOptions = {},
): Promise<EnqueueResult> {
  const batchId = options.batchId ?? `manual-${Date.now()}`;

  const jobs = poiIds.map((poiId) => ({
    data: {
      poiId,
      batchId,
      ...(options.force !== undefined && { force: options.force }),
      ...(options.reason !== undefined && { reason: options.reason }),
    } satisfies EnrichPoiJobData,
    singletonKey: poiId,
    retryLimit: 5,
    retryBackoff: true,
    expireInSeconds: 15 * 60 * 60,
    priority: options.priority ?? 0,
  }));

  const insertedIds = await fastify.pgboss.insert(ENRICH_POI_QUEUE, jobs);

  return {
    batchId,
    enqueued: insertedIds?.length ?? 0,
    skipped: poiIds.length - (insertedIds?.length ?? 0),
  };
}
