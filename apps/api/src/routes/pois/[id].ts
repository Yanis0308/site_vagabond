import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import {
  ErrorResponseSchema,
  GetPoiEnrichedResponseSchema,
  type PoiEnriched,
} from "@vagabond/shared-utils";

import { PoiEnrichmentService } from "../../services/poi-enrichment.service.js";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
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

      try {
        // 1. Check if enriched data already exists (version is already filtered in SQL query)
        const existingEnriched =
          await fastify.dbRepositories.poiEnriched.findByPoiId(poiId);

        if (existingEnriched !== undefined) {
          return await reply.status(200).send({
            data: {
              ...existingEnriched.enrichedData,
              id: existingEnriched.id,
              poiId: existingEnriched.poiId,
              version: existingEnriched.version,
              createdAt: existingEnriched.createdAt.toISOString(),
              updatedAt: existingEnriched.updatedAt.toISOString(),
            },
          });
        }

        // 2. Verify POI exists and get basic info
        const poi =
          await fastify.dbRepositories.poi.findByIdWithNameAndCoords(poiId);

        if (poi === null) {
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

          fastify.log.warn(
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
          return await reply.status(500).send({
            error: {
              type: "INTERNAL_SERVER_ERROR",
              message: "Failed to create enriched POI data",
            },
          });
        }

        // 11. Return enriched data
        return await reply.status(200).send({
          data: {
            ...enriched.enrichedData,
            id: enriched.id,
            poiId: enriched.poiId,
            version: enriched.version,
            createdAt: enriched.createdAt.toISOString(),
            updatedAt: enriched.updatedAt.toISOString(),
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return await reply.status(500).send({
          error: {
            type: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : String(error),
          },
        });
      }
    },
  );
};

export default routes;
