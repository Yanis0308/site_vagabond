import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import {
  type GoogleMapsPlaceStrict,
  jsonSchemas,
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
          200: jsonSchemas.GetPoiEnrichedResponseSchema,
          404: jsonSchemas.ErrorResponseSchema,
          500: jsonSchemas.ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { id: poiId } = request.params;
      const enrichmentService = new PoiEnrichmentService(fastify);

      try {
        // 1. Check if enriched data already exists
        const existingEnriched =
          await fastify.dbRepositories.poiEnriched.findByPoiId(poiId);

        // Temporary disabled for testing
        if (existingEnriched !== null && existingEnriched !== undefined) {
          return await reply.status(200).send({
            data: {
              id: existingEnriched.id,
              poiId: existingEnriched.poiId,
              name: existingEnriched.name,
              description: existingEnriched.description,
              source: existingEnriched.source,
              version: existingEnriched.version,
              createdAt: existingEnriched.createdAt.toISOString(),
              updatedAt: existingEnriched.updatedAt.toISOString(),
              funFacts: existingEnriched.funFacts.map((fact) => ({
                id: fact.id,
                content: fact.content,
                order: fact.order,
                version: fact.version,
                createdAt: fact.createdAt.toISOString(),
                updatedAt: fact.updatedAt.toISOString(),
              })),
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

        // 4. Extract Wikidata and Wikipedia IDs from OSM tags
        const { wikidataId, wikipediaTitle } =
          enrichmentService.extractWikimediaIds(osmTags);

        // 5. Build Jina query
        const jinaQuery = enrichmentService.buildJinaQuery({
          name: poi.name,
          latitude: poi.latitude,
          longitude: poi.longitude,
          cityName: poi.cityName ?? null,
        });

        // 6. Process all data sources in parallel
        const processingResults = await enrichmentService.processDataSources(
          poiId,
          {
            name: poi.name,
            latitude: poi.latitude,
            longitude: poi.longitude,
            cityName: poi.cityName ?? null,
          },
          jinaQuery,
          wikidataId,
          wikipediaTitle,
        );

        // 7. Log processing results for monitoring
        enrichmentService.logProcessingResults(poiId, processingResults);

        // 8. Extract and validate Google Maps place
        const googleMapsPlace = enrichmentService.getGoogleMapsPlaceIfNear(
          processingResults,
          poi.latitude,
          poi.longitude,
        );

        // 9. Extract raw data from processing results
        const rawData: {
          googleMapsRawData: GoogleMapsPlaceStrict | null;
          jinaRawData: Record<string, unknown>;
          wikidataRawData: Record<string, unknown>;
          wikipediaRawData: Record<string, unknown>;
        } = {
          googleMapsRawData: googleMapsPlace,
          jinaRawData: processingResults.jinaResult?.scrapeResponse?.data ?? {},
          wikidataRawData:
            processingResults.wikidataResult?.scrapeResponse?.data ?? {},
          wikipediaRawData:
            processingResults.wikipediaResult?.scrapeResponse?.data ?? {},
        };

        // 10. Process Gemini LLM enrichment
        let enrichmentResult: {
          name: string;
          description: string | null;
          funFacts: Array<{ content: string; order: number }>;
          source: "llm" | "scraper-maps";
        } | null = null;

        try {
          const enrichedData = await enrichmentService.processGeminiEnrichment(
            poiId,
            {
              name: poi.name,
              latitude: poi.latitude,
              longitude: poi.longitude,
              cityName: poi.cityName ?? null,
            },
            rawData,
            osmTags,
          );

          enrichmentResult =
            enrichmentService.mapEnrichedDataToResult(enrichedData);
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

        // 11. Create enriched entry
        if (enrichmentResult === null) {
          return await reply.status(500).send({
            error: {
              type: "INTERNAL_SERVER_ERROR",
              message: "Failed to create enriched POI data",
            },
          });
        }

        const enriched = await fastify.dbRepositories.poiEnriched.upsert({
          poiId,
          name: enrichmentResult.name,
          description: enrichmentResult.description,
          source: enrichmentResult.source,
          funFacts: enrichmentResult.funFacts,
        });

        if (enriched === null || enriched === undefined) {
          return await reply.status(500).send({
            error: {
              type: "INTERNAL_SERVER_ERROR",
              message: "Failed to create enriched POI data",
            },
          });
        }

        // 12. Return enriched data
        return await reply.status(200).send({
          data: {
            id: enriched.id,
            poiId: enriched.poiId,
            name: enriched.name,
            description: enriched.description,
            source: enriched.source,
            version: enriched.version,
            createdAt: enriched.createdAt.toISOString(),
            updatedAt: enriched.updatedAt.toISOString(),
            funFacts: enriched.funFacts.map(
              (fact: {
                id: number;
                content: string;
                order: number;
                version: number;
                createdAt: Date;
                updatedAt: Date;
              }) => ({
                id: fact.id,
                content: fact.content,
                order: fact.order,
                version: fact.version,
                createdAt: fact.createdAt.toISOString(),
                updatedAt: fact.updatedAt.toISOString(),
              }),
            ),
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
