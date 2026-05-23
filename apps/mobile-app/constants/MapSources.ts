export const MAP_SOURCE_IDS = {
  POIS: "remote-pois-source",
  POIS_VORONOI: "remote-pois-source-voronoi",
  BOUNDARIES: "remote-boundaries-source",
  BOUNDARIES_LINES: "remote-boundaries-source-lines",
  BOUNDARIES_LABELS: "remote-boundaries-source-labels",
} as const;

// IDs des layers à l'intérieur du tileset Mapbox (côté MTS recipe).
// IMPORTANT : ces valeurs doivent rester synchronisées avec
// apps/data-manager/src/etl/load/pois-recipe.json
// (et boundaries-recipe.json pour les layers boundaries — gérés dans
// MapLayersConfig.ts).
export const MAP_SOURCE_LAYER_IDS = {
  POIS_DATA: "pois-data-layer-v2",
  VORONOI_ZONES: "voronoi-zones-layer-v2",
} as const;
