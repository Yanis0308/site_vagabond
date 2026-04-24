import { type Static, Type } from "typebox";

import { SimplifiedCoordsSchema } from "../geo.js";

export const UserFeedbackCategorySchema = Type.Union(
  [
    Type.Literal("POI_REPORT"),
    Type.Literal("PLACE_SUGGESTION"),
    Type.Literal("BUG"),
    Type.Literal("SUGGESTION"),
    Type.Literal("INCOMPREHENSION"),
    Type.Literal("OTHER"),
  ],
  { $id: "UserFeedbackCategory" },
);

export const UserFeedbackPoiReportReasonSchema = Type.Union(
  [
    Type.Literal("DATA_ISSUE"),
    Type.Literal("CLOSED"),
    Type.Literal("DUPLICATE"),
    Type.Literal("INAPPROPRIATE_CONTENT"),
    Type.Literal("OTHER"),
  ],
  { $id: "UserFeedbackPoiReportReason" },
);

const userFeedbackBaseProperties = {
  message: Type.String({ minLength: 1, maxLength: 10000 }),
  location: Type.Optional(SimplifiedCoordsSchema),
  city: Type.Optional(Type.String({ minLength: 1, maxLength: 1000 })),
  appVersion: Type.String({ minLength: 1, maxLength: 100 }),
  os: Type.String({ minLength: 1, maxLength: 100 }),
} as const;

export const PoiReportFeedbackPayloadSchema = Type.Object(
  {
    reason: UserFeedbackPoiReportReasonSchema,
    source: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  },
  { $id: "PoiReportFeedbackPayload" },
);

export const PlaceSuggestionFeedbackPayloadSchema = Type.Object(
  {
    name: Type.String({ minLength: 1, maxLength: 1000 }),
    placeType: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  },
  { $id: "PlaceSuggestionFeedbackPayload" },
);

export const BugFeedbackPayloadSchema = Type.Object(
  {
    screen: Type.String({ minLength: 1, maxLength: 255 }),
    traceId: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  },
  { $id: "BugFeedbackPayload" },
);

export const SuggestionFeedbackPayloadSchema = Type.Object(
  {
    topic: Type.String({ minLength: 1, maxLength: 255 }),
  },
  { $id: "SuggestionFeedbackPayload" },
);

export const IncomprehensionFeedbackPayloadSchema = Type.Object(
  {
    feature: Type.String({ minLength: 1, maxLength: 255 }),
  },
  { $id: "IncomprehensionFeedbackPayload" },
);

export const OtherFeedbackPayloadSchema = Type.Object(
  {
    context: Type.String({ minLength: 1, maxLength: 255 }),
  },
  { $id: "OtherFeedbackPayload" },
);

export const CreateUserFeedbackRequestSchema = Type.Union(
  [
    Type.Object(
      {
        ...userFeedbackBaseProperties,
        category: Type.Literal("POI_REPORT"),
        targetPoiId: Type.String({ minLength: 1, maxLength: 1000 }),
        payload: PoiReportFeedbackPayloadSchema,
      },
      { $id: "CreatePoiReportFeedbackRequest" },
    ),
    Type.Object(
      {
        ...userFeedbackBaseProperties,
        category: Type.Literal("PLACE_SUGGESTION"),
        targetPoiId: Type.Optional(
          Type.String({ minLength: 1, maxLength: 1000 }),
        ),
        payload: PlaceSuggestionFeedbackPayloadSchema,
      },
      { $id: "CreatePlaceSuggestionFeedbackRequest" },
    ),
    Type.Object(
      {
        ...userFeedbackBaseProperties,
        category: Type.Literal("BUG"),
        targetPoiId: Type.Optional(
          Type.String({ minLength: 1, maxLength: 1000 }),
        ),
        payload: BugFeedbackPayloadSchema,
      },
      { $id: "CreateBugFeedbackRequest" },
    ),
    Type.Object(
      {
        ...userFeedbackBaseProperties,
        category: Type.Literal("SUGGESTION"),
        targetPoiId: Type.Optional(
          Type.String({ minLength: 1, maxLength: 1000 }),
        ),
        payload: SuggestionFeedbackPayloadSchema,
      },
      { $id: "CreateSuggestionFeedbackRequest" },
    ),
    Type.Object(
      {
        ...userFeedbackBaseProperties,
        category: Type.Literal("INCOMPREHENSION"),
        targetPoiId: Type.Optional(
          Type.String({ minLength: 1, maxLength: 1000 }),
        ),
        payload: IncomprehensionFeedbackPayloadSchema,
      },
      { $id: "CreateIncomprehensionFeedbackRequest" },
    ),
    Type.Object(
      {
        ...userFeedbackBaseProperties,
        category: Type.Literal("OTHER"),
        targetPoiId: Type.Optional(
          Type.String({ minLength: 1, maxLength: 1000 }),
        ),
        payload: OtherFeedbackPayloadSchema,
      },
      { $id: "CreateOtherFeedbackRequest" },
    ),
  ],
  { $id: "CreateUserFeedbackRequest" },
);

export type UserFeedbackCategory = Static<typeof UserFeedbackCategorySchema>;
export type UserFeedbackPoiReportReason = Static<
  typeof UserFeedbackPoiReportReasonSchema
>;
export type PoiReportFeedbackPayload = Static<
  typeof PoiReportFeedbackPayloadSchema
>;
export type PlaceSuggestionFeedbackPayload = Static<
  typeof PlaceSuggestionFeedbackPayloadSchema
>;
export type BugFeedbackPayload = Static<typeof BugFeedbackPayloadSchema>;
export type SuggestionFeedbackPayload = Static<
  typeof SuggestionFeedbackPayloadSchema
>;
export type IncomprehensionFeedbackPayload = Static<
  typeof IncomprehensionFeedbackPayloadSchema
>;
export type OtherFeedbackPayload = Static<typeof OtherFeedbackPayloadSchema>;

export interface UserFeedbackPayloadByCategory {
  POI_REPORT: PoiReportFeedbackPayload;
  PLACE_SUGGESTION: PlaceSuggestionFeedbackPayload;
  BUG: BugFeedbackPayload;
  SUGGESTION: SuggestionFeedbackPayload;
  INCOMPREHENSION: IncomprehensionFeedbackPayload;
  OTHER: OtherFeedbackPayload;
}

export type UserFeedbackPayload<
  Category extends UserFeedbackCategory = UserFeedbackCategory,
> = UserFeedbackPayloadByCategory[Category];

export type CreateUserFeedbackRequest = Static<
  typeof CreateUserFeedbackRequestSchema
>;
