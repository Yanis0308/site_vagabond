import { Type } from "@sinclair/typebox";

import { ApiResponseSchema, Nullable } from "../utils.js";

export const LeaderboardPeriodEnumSchema = Type.Enum(
  {
    ALL_TIME: "all-time",
    MONTHLY: "monthly",
  },
  { $id: "LeaderboardPeriodEnum" },
);

export const LeaderboardQuerySchema = Type.Object(
  {
    period: Type.Ref(LeaderboardPeriodEnumSchema),
  },
  { $id: "LeaderboardQuery" },
);

export const LeaderboardUserSchema = Type.Object(
  {
    userId: Type.String(),
    fullName: Nullable(Type.String()),
    email: Nullable(Type.String()),
    visitedPoisCount: Type.Number(),
    rank: Type.Number(),
    registrationDate: Type.String({ format: "date-time" }),
    lastVisitedPoiDate: Nullable(Type.String({ format: "date-time" })),
  },
  { $id: "LeaderboardUser" },
);

export const LeaderboardResponseSchema = ApiResponseSchema(
  Type.Object({
    users: Type.Array(Type.Ref(LeaderboardUserSchema)),
    period: Type.Ref(LeaderboardPeriodEnumSchema),
  }),
  "LeaderboardResponse",
);
