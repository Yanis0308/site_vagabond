import { type Static, Type } from "typebox";

export const NotificationOpenSourceSchema = Type.Union(
  [
    Type.Literal("foreground"),
    Type.Literal("background"),
    Type.Literal("cold_start"),
  ],
  { $id: "NotificationOpenSource" },
);

export type NotificationOpenSource = Static<
  typeof NotificationOpenSourceSchema
>;

export const TrackNotificationOpenParamsSchema = Type.Object(
  {
    notificationId: Type.String({ format: "uuid" }),
  },
  { $id: "TrackNotificationOpenParams" },
);

export type TrackNotificationOpenParams = Static<
  typeof TrackNotificationOpenParamsSchema
>;

export const TrackNotificationOpenBodySchema = Type.Object(
  {
    source: Type.Optional(NotificationOpenSourceSchema),
  },
  { $id: "TrackNotificationOpenBody" },
);

export type TrackNotificationOpenBody = Static<
  typeof TrackNotificationOpenBodySchema
>;
