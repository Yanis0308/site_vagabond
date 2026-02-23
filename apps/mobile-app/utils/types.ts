import { type PoiFilterLevelEnum } from "@vagabond/shared-utils";

export interface PoiType {
  id: string;
  coords: { latitude: number; longitude: number };
  name: string;
  filterLevel: PoiFilterLevelEnum;
}
