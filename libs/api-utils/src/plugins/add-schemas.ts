import { jsonSchemas } from "@vagabond/shared-utils";
import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(
  function schemasRegister(fastify: FastifyInstance) {
    Object.values(jsonSchemas).forEach((schema) => {
      try {
        fastify.log.info(`Adding schema: '${schema.$id}'`);

        fastify.addSchema(schema);
      } catch (error) {
        fastify.log.error(
          `Invalid schema: '${JSON.stringify(schema)}' with type '${typeof schema}' - error: ${JSON.stringify(
            error,
          )}`,
        );
        throw error;
      }
    });
  },
  {
    name: "add-schemas",
  },
);
