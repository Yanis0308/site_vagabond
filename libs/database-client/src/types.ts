import {
  type UserFeedbackCategory,
  type UserFeedbackPayload,
} from "@vagabond/shared-utils";

/** Processing result types — used in API code; DB column stays varchar */
export const PROCESSING_TYPES = [
  "llm",
  "wikidata",
  "wikipedia",
  "jina-search",
  "jina-reader",
] as const;

export type ProcessingType = (typeof PROCESSING_TYPES)[number];

export interface UserFeedbackLocation {
  latitude: number;
  longitude: number;
}

export interface UserFeedbackCreateInput {
  category: UserFeedbackCategory;
  payload: UserFeedbackPayload;
  message: string;
  targetPoiId?: string | undefined;
  location?: UserFeedbackLocation | undefined;
  city?: string | undefined;
  appVersion: string;
  os: string;
}

export interface CustomPoiCreateInput {
  id: string;
  source: "OSM";
  sourceId: string;
  filterLevel: "UNKNOWN" | "STRICT" | "STANDARD" | "INTERMEDIATE" | "LAXIST";
  coords: {
    latitude: number;
    longitude: number;
  };
}
