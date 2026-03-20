import { type Static, Type } from "typebox";

import { CoordsSchema } from "../geo.js";
import { Nullable } from "../utils.js";

export const UserLocationRequestSchema = Type.Object(
  {
    coords: CoordsSchema,
    accuracy: Nullable(Type.Number()),
    altitude: Nullable(Type.Number()),
    altitudeAccuracy: Nullable(Type.Number()),
    heading: Nullable(Type.Number()),
    speed: Nullable(Type.Number()),
    timestamp: Type.Number(), // in milliseconds
  },
  { $id: "UserLocationRequest" },
);

export type UserLocationRequest = Static<typeof UserLocationRequestSchema>;
