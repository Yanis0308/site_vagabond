import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { type PoiEnrichedWithData } from "@vagabond/database-client";
import {
  ErrorResponseSchema,
  GetPoiEnrichedResponseSchema,
  type PoiEnriched,
  type PoiEnrichedData,
} from "@vagabond/shared-utils";

import { PoiEnrichmentService } from "../../services/poi-enrichment.service.js";

const serializePoiEnriched = (row: PoiEnrichedWithData): PoiEnrichedData => ({
  ...row.enrichedData,
  id: row.id,
  poiId: row.poiId,
  version: row.version,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

type EnrichmentOutcome =
  | { enriched: PoiEnrichedWithData }
  | { httpStatus: 404 | 500; message: string };

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  const enrichmentInProgress = new Map<string, Promise<EnrichmentOutcome>>();

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["pois"],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: GetPoiEnrichedResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { id: poiId } = request.params;
      const enrichmentService = new PoiEnrichmentService(fastify);
      let resolveEnrichment: ((outcome: EnrichmentOutcome) => void) | undefined;
      let enrichmentOutcome: EnrichmentOutcome | undefined;

      try {
        // 1. Check if enriched data already exists (version is already filtered in SQL query)
        const existingEnriched =
          await fastify.dbRepositories.poiEnriched.findByPoiId(poiId);

        if (existingEnriched !== undefined) {
          return await reply.status(200).send({
            data: serializePoiEnriched(existingEnriched),
          });
        }

        // Déduplication : si un enrichissement est déjà en cours pour ce POI, on attend et on retourne le résultat
        const inProgress = enrichmentInProgress.get(poiId);
        if (inProgress !== undefined) {
          request.log.info(
            { poiId },
            "Enrichment already in progress, waiting for result",
          );
          const outcome = await inProgress;
          if ("enriched" in outcome) {
            return await reply.status(200).send({
              data: serializePoiEnriched(outcome.enriched),
            });
          }
          return await reply.status(outcome.httpStatus).send({
            error: {
              type:
                outcome.httpStatus === 404
                  ? "NOT_FOUND"
                  : "INTERNAL_SERVER_ERROR",
              message: outcome.message,
            },
          });
        }

        // Enregistrement du verrou pour les requêtes concurrentes
        enrichmentInProgress.set(
          poiId,
          new Promise<EnrichmentOutcome>((resolve) => {
            resolveEnrichment = resolve;
          }),
        );

        // 2. Verify POI exists and get basic info
        const poi =
          await fastify.dbRepositories.poi.findByIdWithNameAndCoords(poiId);

        if (poi === null) {
          enrichmentOutcome = { httpStatus: 404, message: "POI not found" };
          return await reply.status(404).send({
            error: {
              type: "NOT_FOUND",
              message: "POI not found",
            },
          });
        }

        // 3. Get OSM tags for this POI (source of truth for filtering)
        const osmTags =
          await fastify.dbRepositories.poi.findOsmTagsByPoiId(poiId);

        // 4. Build Jina Search query
        const jinaSearchQuery = enrichmentService.buildJinaSearchQuery({
          name: poi.name,
          latitude: poi.latitude,
          longitude: poi.longitude,
          cityName: poi.cityName ?? null,
        });

        // 5. Process all data sources in parallel (Google Maps + Jina Search+Reader)
        const processingResults = await enrichmentService.processDataSources(
          poiId,
          {
            name: poi.name,
            latitude: poi.latitude,
            longitude: poi.longitude,
            cityName: poi.cityName ?? null,
          },
          jinaSearchQuery,
          osmTags,
        );

        // 6. Log processing results for monitoring
        enrichmentService.logProcessingResults(poiId, processingResults);

        // 7. Extract and validate Google Maps place
        const googleMapsPlace = enrichmentService.getGoogleMapsPlaceIfNear(
          processingResults,
          poi.latitude,
          poi.longitude,
        );

        // 8. Build raw data for LLM
        const rawData = {
          googleMapsRawData: googleMapsPlace,
          wikipediaRawData: processingResults.jinaEnriched.wikipediaContent,
          wikidataRawData: processingResults.jinaEnriched.wikidataContent,
          webRawData: processingResults.jinaEnriched.webContent,
        };

        // 9. Process Gemini LLM enrichment
        let enrichedData: PoiEnriched | null = null;

        try {
          enrichedData = await enrichmentService.processGeminiEnrichment(
            poiId,
            {
              name: poi.name,
              latitude: poi.latitude,
              longitude: poi.longitude,
              cityName: poi.cityName ?? null,
            },
            rawData,
            osmTags,
            processingResults.batchId,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          const errorName = error instanceof Error ? error.name : typeof error;

          request.log.warn(
            {
              errorMessage,
              errorStack,
              errorName,
              errorString: String(error),
              poiId,
            },
            "Gemini LLM enrichment failed, falling back to basic extraction",
          );
        }

        // 10. Create enriched entry
        if (enrichedData === null) {
          enrichmentOutcome = {
            httpStatus: 500,
            message: "Failed to create enriched POI data",
          };
          return await reply.status(500).send({
            error: {
              type: "INTERNAL_SERVER_ERROR",
              message: "Failed to create enriched POI data",
            },
          });
        }

        const enriched = await fastify.dbRepositories.poiEnriched.upsert({
          poiId,
          enrichedData,
          source: "llm",
        });

        if (enriched === undefined) {
          enrichmentOutcome = {
            httpStatus: 500,
            message: "Failed to create enriched POI data",
          };
          return await reply.status(500).send({
            error: {
              type: "INTERNAL_SERVER_ERROR",
              message: "Failed to create enriched POI data",
            },
          });
        }

        // 11. Return enriched data
        enrichmentOutcome = { enriched };
        return await reply.status(200).send({
          data: serializePoiEnriched(enriched),
        });
      } catch (error) {
        request.log.error(error);
        const message = error instanceof Error ? error.message : String(error);
        enrichmentOutcome = { httpStatus: 500, message };
        return await reply.status(500).send({
          error: {
            type: "INTERNAL_SERVER_ERROR",
            message,
          },
        });
      } finally {
        if (resolveEnrichment !== undefined) {
          enrichmentInProgress.delete(poiId);
          resolveEnrichment(
            enrichmentOutcome ?? {
              httpStatus: 500,
              message: "Unexpected error during enrichment",
            },
          );
        }
      }
    },
  );
};

export default routes;
