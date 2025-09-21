import {
  type PoiFilterLevelEnum,
  type PoiSourceEnum,
} from "./generated/client/index.js";

export interface CustomPoiCreateInput {
  id: string;
  source: PoiSourceEnum;
  sourceId: string;
  filterLevel: PoiFilterLevelEnum;
  coords: {
    latitude: number;
    longitude: number;
  };
}
