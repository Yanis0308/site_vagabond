import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
// Import type to ensure FastifyInstance type augmentation is available
// This import triggers the evaluation of the module augmentation in @vagabond/api-utils
import type { DbRepositories } from "@vagabond/api-utils";
import { jsonSchemas } from "@vagabond/shared-utils";

import { scrapeGoogleMapsWithPage } from "../../maps-scraper/scraper.js";
import { puppeteerSingleton } from "../../services/puppeteer-singleton.js";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  // Type assertion to ensure DbRepositories augmentation is evaluated
  // This ensures fastify.dbRepositories is available on FastifyInstance
  void null as unknown as DbRepositories;
  fastify.get(
    "/scrape",
    {
      schema: {
        tags: ["scrape"],
        querystring: Type.Ref(jsonSchemas.ScrapeQuerySchema),
        response: {
          200: Type.Ref(jsonSchemas.ScrapeResponseSchema),
          400: Type.Object({
            error: Type.String(),
          }),
          404: Type.Object({
            error: Type.String(),
          }),
          500: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async function (request, reply) {
      const { poiId, batchId } = request.query;

      try {
        // 1. Récupérer le POI (coords) et poi_data (name) depuis la BDD
        const poi =
          await fastify.dbRepositories.poi.findByIdWithNameAndCoords(poiId);

        if (poi === null) {
          return await reply.status(404).send({ error: "POI not found" });
        }

        // 2. Construire la requête Google Maps avec nom + coordonnées
        const geoCoordinates = `${poi.latitude},${poi.longitude}`;
        const query = poi.name;

        // 3. Créer un enregistrement processing_results avec status=pending
        const input = {
          poiId,
          query,
          geoCoordinates,
          zoom: 15,
          langCode: "fr",
        };

        const processingResult =
          await fastify.dbRepositories.processingResult.create({
            targetId: poiId,
            status: "pending",
            input,
            batchId: batchId ?? null,
            type: "scraper-maps",
          });

        if (processingResult === undefined) {
          return await reply
            .status(500)
            .send({ error: "Failed to create processing result" });
        }

        let output:
          | { content: Record<string, unknown> }
          | { error: string }
          | null = null;
        let status: "success" | "error" = "success";

        try {
          // 4. Lancer le scraping Puppeteer (utilise le singleton)
          const browser = await puppeteerSingleton.getBrowser({
            headless: fastify.config.headlessMode,
          });

          const page = await browser.newPage();

          try {
            const placeEntries = await scrapeGoogleMapsWithPage(page, query, {
              langCode: "fr",
              geoCoordinates,
              zoom: 15,
            });

            // 5. Mettre à jour le résultat (success + output)
            output = {
              content: {
                places: placeEntries,
                count: placeEntries.length,
              },
            };
            status = "success";
          } finally {
            // Close page but keep browser instance alive
            await page.close();
          }
        } catch (error) {
          // 5. Mettre à jour le résultat (error + output)
          status = "error";
          output = {
            error: error instanceof Error ? error.message : String(error),
          };
        }

        // Mettre à jour le résultat dans la BDD
        await fastify.dbRepositories.processingResult.update(
          processingResult.id,
          {
            status,
            output,
          },
        );

        // 6. Retourner le résultat
        return await reply.status(200).send({
          id: processingResult.id,
          targetId: poiId,
          status,
          input,
          output,
          batchId: batchId ?? null,
          type: "scraper-maps",
        });
      } catch (error) {
        fastify.log.error(error);
        return await reply.status(500).send({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );
};

export default routes;
