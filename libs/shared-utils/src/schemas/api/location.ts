import { type Static, Type } from "typebox";

import { CoordsSchema } from "../geo.js";

export const UserLocationRequestSchema = Type.Intersect(
  [
    CoordsSchema,
    Type.Object({
      timestamp: Type.Number(), // in milliseconds
    }),
  ],
  { $id: "UserLocationRequest" },
);

export type UserLocationRequest = Static<typeof UserLocationRequestSchema>;
