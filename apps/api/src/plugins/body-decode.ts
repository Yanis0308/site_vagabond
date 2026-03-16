import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { type TSchema } from "typebox";
import { HasCodec, Value } from "typebox/value";

export default fp(
  function bodyDecodePlugin(fastify: FastifyInstance): void {
    fastify.addHook("preHandler", (request, _reply, done) => {
      const bodySchema = request.routeOptions.schema?.body as
        | TSchema
        | undefined;

      if (bodySchema !== undefined) {
        if (HasCodec(bodySchema)) {
          try {
            request.body = Value.Decode(bodySchema, request.body);
          } catch (err) {
            if (err instanceof Error) {
              done(err);
            } else {
              request.log.error(
                err,
                "An unknown error occurred during body decoding",
              );
              done(new Error("An unknown error occurred during body decoding"));
            }
            return;
          }
        }
      }
      done();
    });
  },
  { name: "body-decode" },
);
