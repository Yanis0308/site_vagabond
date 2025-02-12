import { getPrismaExtendedClient } from "@vagabond/database-client";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

// Strongly inspired by https://github.com/joggrdocs/fastify-prisma

declare module "fastify" {
  interface FastifyInstance {
    prisma: ReturnType<typeof getPrismaExtendedClient>;
  }
}

export default fp(
  async (fastify: FastifyInstance): Promise<void> => {
    const decoratorName = "prisma";

    if (!fastify.hasDecorator(decoratorName)) {
      const prismaExtendedClient = getPrismaExtendedClient();
      await prismaExtendedClient.$connect();
      fastify.decorate(decoratorName, prismaExtendedClient);

      fastify.addHook("onClose", async (server) => {
        await server.prisma.$disconnect();
      });
    } else {
      throw new Error(
        "A `prisma` decorator has already been registered, please ensure you are not registering multiple instances of this plugin",
      );
    }
  },
  {
    name: "fastify-prisma",
    fastify: "5.x",
  },
);
