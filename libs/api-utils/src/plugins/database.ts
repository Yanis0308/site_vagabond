import {
  BoundaryRepository,
  DashboardAppReviewRepository,
  DashboardFeedbackRepository,
  DashboardListingsRepository,
  DashboardUserRepository,
  getDrizzleClient,
  NotificationEventRepository,
  OrganizationRepository,
  PoiEnrichedRepository,
  PoiRepository,
  ProcessingResultRepository,
  PushDeviceRepository,
  SearchRepository,
  StaffToolsRepository,
  StatsRepository,
  UserFeedbackRepository,
  UserLocationRepository,
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
  dashboardUser: DashboardUserRepository;
  dashboardListings: DashboardListingsRepository;
  dashboardFeedback: DashboardFeedbackRepository;
  dashboardAppReview: DashboardAppReviewRepository;
  organization: OrganizationRepository;
  stats: StatsRepository;
  userFeedback: UserFeedbackRepository;
  location: UserLocationRepository;
  visitedPoi: VisitedPoiRepository;
  processingResult: ProcessingResultRepository;
  pushDevice: PushDeviceRepository;
  notificationEvent: NotificationEventRepository;
  staffTools: StaffToolsRepository;
}

declare module "fastify" {
  interface FastifyInstance {
    dbRepositories: DbRepositories;
    dbPing: () => Promise<void>;
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
        dashboardUser: new DashboardUserRepository(db),
        dashboardListings: new DashboardListingsRepository(db),
        dashboardFeedback: new DashboardFeedbackRepository(db),
        dashboardAppReview: new DashboardAppReviewRepository(db),
        organization: new OrganizationRepository(db),
        stats: new StatsRepository(db),
        userFeedback: new UserFeedbackRepository(db),
        location: new UserLocationRepository(db),
        visitedPoi: new VisitedPoiRepository(db),
        processingResult: new ProcessingResultRepository(db),
        pushDevice: new PushDeviceRepository(db),
        notificationEvent: new NotificationEventRepository(db),
        staffTools: new StaffToolsRepository(db),
      };

      fastify.decorate(decoratorName, repositories);
      fastify.decorate("dbPing", () => db.ping());

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
