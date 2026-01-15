import {
  type FastifyPluginCallbackTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import {
  ScrapeDataScraperQuerySchema,
  ScrapeDataScraperResponseSchema,
} from "@vagabond/shared-utils";

import { scrapeGoogleMapsWithPage } from "../../maps-scraper/scraper.js";
import { puppeteerSingleton } from "../../services/puppeteer-singleton.js";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/scrape",
    {
      schema: {
        tags: ["scrape"],
        querystring: ScrapeDataScraperQuerySchema,
        response: {
          200: ScrapeDataScraperResponseSchema,
          400: Type.Object({
            error: Type.String(),
          }),
          500: ScrapeDataScraperResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const {
        query,
        geoCoordinates,
        zoom = 15,
        langCode = "fr",
      } = request.query;

      try {
        // Launch Puppeteer scraping
        const browser = await puppeteerSingleton.getBrowser({
          headless: fastify.config.headlessMode,
        });

        const page = await browser.newPage();

        try {
          const place = await scrapeGoogleMapsWithPage(page, query, {
            langCode,
            geoCoordinates,
            zoom,
          });

          // Return success with scraped places
          return await reply.status(200).send({
            success: true,
            place: place,
          });
        } catch (error) {
          // Release browser usage on error
          puppeteerSingleton.releaseBrowser();
          fastify.log.error({ error }, "Scraping error");

          // Return error response
          return await reply.status(500).send({
            success: false,
            place: null,
            error: error instanceof Error ? error.message : String(error),
          });
        } finally {
          // Close page but keep browser instance alive
          await page.close();
          // Release browser usage so it can be closed if inactive
          puppeteerSingleton.releaseBrowser();
        }
      } catch (error) {
        fastify.log.error({ error }, "Failed to scrape");
        return await reply.status(500).send({
          success: false,
          place: null,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );
};

export default routes;
