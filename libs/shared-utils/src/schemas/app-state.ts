import { Type, type Static } from "typebox";

/**
 * Schema for APP_INITIALIZATION_STATE structure
 * This validates the data we receive from Google Maps
 */
export const AppInitializationStateSchema = Type.Array(Type.Unknown(), {
  description: "Root array of APP_INITIALIZATION_STATE",
  minItems: 4,
  $id: "AppInitializationState",
});

/**
 * Schema for APP_INITIALIZATION_STATE[3] which contains the place data
 * This is an array of 7 elements where [5] or [6] typically contains the JSON string with place data
 */
export const AppStateDataSchema = Type.Array(Type.Unknown(), {
  description: "Place data array at APP_INITIALIZATION_STATE[3]",
  minItems: 7,
  $id: "AppStateData",
});

export type AppInitializationState = Static<
  typeof AppInitializationStateSchema
>;
export type AppStateData = Static<typeof AppStateDataSchema>;
