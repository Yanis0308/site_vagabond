import { type MapView } from "@rnmapbox/maps";
import { booleanPointInPolygon, point } from "@turf/turf";
import { type Feature, type MultiPolygon, type Polygon } from "geojson";

const SOURCE_ID = "remote-boundaries-source-lines";

const isPolygonFeature = (f: Feature): f is Feature<Polygon | MultiPolygon> =>
  f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon";

export const getZoneFromLocation = async (
  mapRef: MapView,
  longitude: number,
  latitude: number,
  sourceLayerId: string,
): Promise<string | null> => {
  const userPoint = point([longitude, latitude]);

  // querySourceFeatures retourne Promise<GeoJSON.FeatureCollection> — pas de cast nécessaire.
  const result = await mapRef.querySourceFeatures(
    SOURCE_ID,
    [],
    [sourceLayerId],
  );

  const match = result.features
    .filter(isPolygonFeature)
    .find((f) => booleanPointInPolygon(userPoint, f));

  return (match?.properties?.name as string | undefined) ?? null;
};
