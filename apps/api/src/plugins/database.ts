import {
  BoundaryRepository,
  getDrizzleClient,
  PoiEnrichedRepository,
  PoiRepository,
  ProcessingResultRepository,
  SearchRepository,
  UserRepository,
  VisitedPoiRepository,
} from "@vagabond/database-client";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export interface DbRepositories {
  poi: PoiRepository;
  poiEnriched: PoiEnrichedRepository;
  boundary: BoundaryRepository;
  search: SearchRepository;
  user: UserRepository;
  visitedPoi: VisitedPoiRepository;
  processingResult: ProcessingResultRepository;
}

declare module "fastify" {
  interface FastifyInstance {
    dbRepositories: DbRepositories;
  }
}

export default fp(
  async (fastify: FastifyInstance): Promise<void> => {
    const decoratorName = "dbRepositories";

    if (!fastify.hasDecorator(decoratorName)) {
      const db = await getDrizzleClient();

      const repositories: DbRepositories = {
        poi: new PoiRepository(db),
        poiEnriched: new PoiEnrichedRepository(db),
        boundary: new BoundaryRepository(db),
        search: new SearchRepository(db),
        user: new UserRepository(db),
        visitedPoi: new VisitedPoiRepository(db),
        processingResult: new ProcessingResultRepository(db),
      };

      fastify.decorate(decoratorName, repositories);

      fastify.addHook("onClose", async () => {
        await db.close();
      });
    } else {
      throw new Error(
        "A `dbRepositories` decorator has already been registered, please ensure you are not registering multiple instances of this plugin",
      );
    }
  },
  {
    name: "fastify-drizzle",
    fastify: "5.x",
  },
);
