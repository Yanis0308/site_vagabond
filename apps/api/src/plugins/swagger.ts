import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(
  async function swaggerRegister(fastify: FastifyInstance) {
    await fastify.register(swagger, {
      openapi: {
        openapi: "3.0.0",
        info: {
          title: "Vagabond API",
          description: "API for the Vagabond mobile app",
          version: "1.0.0",
        },
        servers: [
          {
            url: "http://localhost:3000",
            description: "Development server",
          },
        ],
        tags: [
          { name: "pois", description: "POIs related end-points" },
          {
            name: "visited-pois",
            description: "Visited POIs related end-points",
          },
          {
            name: "user-feedbacks",
            description: "User feedback related end-points",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        externalDocs: {
          url: "https://swagger.io",
          description: "Find more info here",
        },
      },
    });

    await fastify.register(swaggerUi, {
      routePrefix: "/documentation",
      uiConfig: {
        docExpansion: "full",
      },
      staticCSP: true,
    });
  },
  {
    name: "swagger",
    dependencies: ["add-schemas"],
  },
);
