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
