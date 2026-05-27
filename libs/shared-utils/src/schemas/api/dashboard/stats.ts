import { type Static, Type } from "typebox";

import { ApiResponseSchema } from "../../utils.js";

export const DashboardStatsQuerySchema = Type.Object(
  {
    from: Type.Optional(Type.String({ format: "date-time" })),
    to: Type.Optional(Type.String({ format: "date-time" })),
  },
  { $id: "DashboardStatsQuery" },
);

export const DashboardStatsCountersSchema = Type.Object(
  {
    pois: Type.Number({ minimum: 0 }),
    mobileUsers: Type.Number({ minimum: 0 }),
    visitedPois: Type.Number({ minimum: 0 }),
    userFeedbacks: Type.Number({ minimum: 0 }),
  },
  { $id: "DashboardStatsCounters" },
);

export const DashboardStatsTimeseriesPointSchema = Type.Object(
  {
    date: Type.String(),
    visitedPois: Type.Number({ minimum: 0 }),
    userFeedbacks: Type.Number({ minimum: 0 }),
    appReviewsPositive: Type.Number({ minimum: 0 }),
    appReviewsNegative: Type.Number({ minimum: 0 }),
    newMobileUsers: Type.Number({ minimum: 0 }),
  },
  { $id: "DashboardStatsTimeseriesPoint" },
);

export const DashboardStatsDataSchema = Type.Object(
  {
    counters: DashboardStatsCountersSchema,
    timeseries: Type.Array(DashboardStatsTimeseriesPointSchema),
  },
  { $id: "DashboardStatsData" },
);

export const GetDashboardStatsResponseSchema = ApiResponseSchema(
  DashboardStatsDataSchema,
  "GetDashboardStatsResponse",
);

export type DashboardStatsQuery = Static<typeof DashboardStatsQuerySchema>;
export type DashboardStatsCounters = Static<
  typeof DashboardStatsCountersSchema
>;
export type DashboardStatsTimeseriesPoint = Static<
  typeof DashboardStatsTimeseriesPointSchema
>;
export type DashboardStatsData = Static<typeof DashboardStatsDataSchema>;
