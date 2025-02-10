import type { LayerProps } from "@vis.gl/react-maplibre";

export const INITIAL_VIEW_STATE = {
  longitude: 3.0573,
  latitude: 50.6292,
  zoom: 11.5,
};

export const MARKER_SIZE = 24;

export const polygonData = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [3.0385531, 50.6361152],
        // ... (rest of the coordinates)
      ],
    ],
  },
} as const;

export const fillLayer: LayerProps = {
  id: "test-polygon",
  type: "fill",
  source: "test-polygon",
  paint: {
    "fill-color": "#0080ff",
    "fill-opacity": 0.5,
  },
};

export const lineLayer: LayerProps = {
  id: "test-polygon-outline",
  type: "line",
  source: "test-polygon",
  paint: {
    "line-color": "#000",
    "line-width": 2,
  },
};
