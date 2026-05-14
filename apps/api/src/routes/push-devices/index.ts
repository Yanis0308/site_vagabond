import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
  DeletePushDeviceRequestSchema,
  EmptyResponseSchema,
  ErrorResponseSchema,
  RegisterPushDeviceRequestSchema,
  RegisterPushDeviceResponseSchema,
} from "@vagabond/shared-utils";

import { captureAndLog } from "../../utils/logger.js";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["push-devices"],
        security: [{ bearerAuth: [] }],
        body: RegisterPushDeviceRequestSchema,
        response: {
          200: RegisterPushDeviceResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { userId } = request.user.db;
      const { token, platform, appVersion, osVersion, deviceModel } =
        request.body;

      try {
        const { id } = await fastify.dbRepositories.pushDevice.upsertByToken({
          userId,
          token,
          platform,
          appVersion,
          osVersion,
          deviceModel: deviceModel ?? null,
        });

        return await reply.status(200).send({ data: { id } });
      } catch (error) {
        captureAndLog(fastify, error, "Error upserting push device", {
          tags: { operation: "push-device-upsert" },
          extra: { userId },
        });

        return await reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Failed to register push device",
        });
      }
    },
  );

  fastify.delete(
    "/",
    {
      schema: {
        tags: ["push-devices"],
        security: [{ bearerAuth: [] }],
        body: DeletePushDeviceRequestSchema,
        response: {
          200: EmptyResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const { userId } = request.user.db;
      const { token } = request.body;

      try {
        await fastify.dbRepositories.pushDevice.deleteByToken(userId, token);

        return await reply.status(200).send({ data: {} });
      } catch (error) {
        captureAndLog(fastify, error, "Error deleting push device", {
          tags: { operation: "push-device-delete" },
          extra: { userId },
        });

        return await reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Failed to deregister push device",
        });
      }
    },
  );
};

export default routes;
