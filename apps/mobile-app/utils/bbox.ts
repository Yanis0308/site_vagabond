import * as turf from "@turf/turf";
import { getBoundsOfDistance, getDistance, isPointInPolygon } from "geolib";

// Constantes pour le clustering
export const CLUSTER_MAX_ZOOM = 14;

// Type pour les données de bbox
export interface BboxData {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Type pour un point géographique
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

// Type pour un polygone (liste de points)
export type GeoPolygon = GeoPoint[];

/**
 * Vérifie si deux bboxes se chevauchent
 * Une bbox chevauche une autre si au moins un de ses coins est dans l'autre bbox
 */
export const doBboxesIntersect = (
  bbox1: BboxData,
  bbox2: BboxData,
): boolean => {
  // Convertir bbox2 en polygone
  const polygon2 = [
    { latitude: bbox2.minLat, longitude: bbox2.minLng }, // SW
    { latitude: bbox2.minLat, longitude: bbox2.maxLng }, // SE
    { latitude: bbox2.maxLat, longitude: bbox2.maxLng }, // NE
    { latitude: bbox2.maxLat, longitude: bbox2.minLng }, // NW
  ];

  // Vérifier si au moins un coin de bbox1 est dans bbox2
  const corners1 = [
    { latitude: bbox1.minLat, longitude: bbox1.minLng },
    { latitude: bbox1.minLat, longitude: bbox1.maxLng },
    { latitude: bbox1.maxLat, longitude: bbox1.maxLng },
    { latitude: bbox1.maxLat, longitude: bbox1.minLng },
  ];

  const someCorner1InBbox2 = corners1.some((corner) =>
    isPointInPolygon(corner, polygon2),
  );

  if (someCorner1InBbox2) {
    return true;
  }

  // Vérifier l'inverse : si au moins un coin de bbox2 est dans bbox1
  const polygon1 = [
    { latitude: bbox1.minLat, longitude: bbox1.minLng },
    { latitude: bbox1.minLat, longitude: bbox1.maxLng },
    { latitude: bbox1.maxLat, longitude: bbox1.maxLng },
    { latitude: bbox1.maxLat, longitude: bbox1.minLng },
  ];

  const corners2 = [
    { latitude: bbox2.minLat, longitude: bbox2.minLng },
    { latitude: bbox2.minLat, longitude: bbox2.maxLng },
    { latitude: bbox2.maxLat, longitude: bbox2.maxLng },
    { latitude: bbox2.maxLat, longitude: bbox2.minLng },
  ];

  return corners2.some((corner) => isPointInPolygon(corner, polygon1));
};

/**
 * Convertit une bbox en polygone (rectangle)
 */
export const bboxToPolygon = (bbox: BboxData): GeoPolygon => {
  return [
    { latitude: bbox.minLat, longitude: bbox.minLng }, // SW
    { latitude: bbox.minLat, longitude: bbox.maxLng }, // SE
    { latitude: bbox.maxLat, longitude: bbox.maxLng }, // NE
    { latitude: bbox.maxLat, longitude: bbox.minLng }, // NW
    { latitude: bbox.minLat, longitude: bbox.minLng }, // Fermer le polygone
  ];
};

/**
 * Calcule la bbox englobante d'un polygone
 */
export const getBboxFromPolygon = (polygon: GeoPolygon): BboxData => {
  if (polygon.length === 0) {
    return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
  }

  const lats = polygon.map((p) => p.latitude);
  const lngs = polygon.map((p) => p.longitude);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
};

/**
 * Convertit un GeoPolygon en format Turf
 */
const geoPolygonToTurf = (polygon: GeoPolygon): GeoJSON.Feature => {
  const coordinates = polygon.map((p) => [p.longitude, p.latitude]);
  return turf.polygon([coordinates]);
};

/**
 * Convertit un polygone Turf en GeoPolygon
 */
const turfToGeoPolygon = (turfPolygon: GeoJSON.Feature): GeoPolygon[] => {
  const geometry = turfPolygon.geometry;

  if (!geometry) {
    return [];
  }

  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates[0];
    if (!coords) {
      return [];
    }
    return [
      coords.map(
        ([lng, lat]: number[]) =>
          ({
            latitude: lat,
            longitude: lng,
          }) as GeoPoint,
      ),
    ];
  } else if (geometry.type === "MultiPolygon") {
    // MultiPolygon
    const coords = geometry.coordinates;
    if (!coords || coords.length === 0) {
      return [];
    }
    return coords
      .map((poly: number[][][]) => {
        if (!poly?.[0]) {
          return [] as GeoPoint[];
        }
        return poly[0].map(
          ([lng, lat]: number[]) =>
            ({
              latitude: lat,
              longitude: lng,
            }) as GeoPoint,
        );
      })
      .filter((p) => p.length > 0);
  }

  return [];
};

/**
 * Fusionne plusieurs polygones en un seul (union géométrique)
 * Retourne un ou plusieurs polygones selon la forme résultante
 */
export const mergePolygons = (polygons: GeoPolygon[]): GeoPolygon[] => {
  if (polygons.length === 0) {
    return [];
  }

  if (polygons.length === 1) {
    return polygons;
  }

  try {
    // Convertir tous les polygones en format Turf
    const turfPolygons = polygons.map(geoPolygonToTurf);

    // Fusionner progressivement
    let result = turfPolygons[0];
    if (!result) {
      return polygons;
    }

    for (let i = 1; i < turfPolygons.length; i++) {
      const current = turfPolygons[i];
      if (!current) {
        continue;
      }

      try {
        const fc = turf.featureCollection([
          result,
          current,
        ]) as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
        const unionResult = turf.union(fc);
        if (unionResult) {
          result = unionResult as GeoJSON.Feature;
        }
      } catch (e) {
        // Si la fusion échoue, continuer avec le résultat actuel
        console.warn("Failed to merge polygon:", e);
      }
    }

    // Convertir le résultat en GeoPolygon
    if (result) {
      return turfToGeoPolygon(result);
    }
    return polygons;
  } catch (error) {
    // En cas d'erreur, retourner tous les polygones séparément
    console.error("Error merging polygons:", error);
    return polygons;
  }
};

/**
 * Vérifie si une bbox est complètement contenue dans un ensemble de polygones
 */
export const isBboxInPolygons = (
  bbox: BboxData,
  polygons: GeoPolygon[],
): boolean => {
  if (polygons.length === 0) {
    return false;
  }

  // Convertir la bbox en polygone
  const bboxPolygon = bboxToPolygon(bbox);

  // Vérifier si tous les coins de la bbox sont dans au moins un des polygones
  const corners = bboxPolygon.slice(0, 4); // Sans le point de fermeture

  return corners.every((corner) =>
    polygons.some((polygon) => isPointInPolygon(corner, polygon)),
  );
};

/**
 * Vérifie si un point est proche d'une bbox (dans un certain rayon en mètres)
 */
export const isPointNearBbox = (
  point: { latitude: number; longitude: number },
  bbox: BboxData,
  radiusMeters = 20000, // 20km par défaut
): boolean => {
  // Calculer le centre de la bbox
  const centerLat = (bbox.minLat + bbox.maxLat) / 2;
  const centerLng = (bbox.minLng + bbox.maxLng) / 2;

  // Utiliser getDistance pour vérifier la distance
  const distance = getDistance(point, {
    latitude: centerLat,
    longitude: centerLng,
  });

  return distance <= radiusMeters;
};

/**
 * Calcule une bbox avec une taille minimale configurable en mètres en utilisant geolib
 * @param northEast Coin nord-est de la bbox
 * @param southWest Coin sud-ouest de la bbox
 * @param minSizeMeters Taille minimale de la bbox en mètres (par défaut 10km)
 */
export const calculateBboxWithMinSize = (
  northEast: GeoJSON.Position,
  southWest: GeoJSON.Position,
  minSizeMeters: number,
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} | null => {
  // Vérifier que les coordonnées sont valides
  if (
    typeof northEast[0] !== "number" ||
    typeof northEast[1] !== "number" ||
    typeof southWest[0] !== "number" ||
    typeof southWest[1] !== "number"
  ) {
    return null;
  }

  // Calculer le centre
  const centerLat = (northEast[1] + southWest[1]) / 2;
  const centerLng = (northEast[0] + southWest[0]) / 2;

  // Calculer la distance actuelle en mètres
  const currentDistance = getDistance(
    { latitude: southWest[1], longitude: southWest[0] },
    { latitude: northEast[1], longitude: northEast[0] },
  );

  // Si la distance actuelle est déjà plus grande que la taille minimale, retourner la bbox actuelle
  if (currentDistance >= minSizeMeters) {
    return {
      minLat: southWest[1],
      maxLat: northEast[1],
      minLng: southWest[0],
      maxLng: northEast[0],
    };
  }

  // Utiliser geolib pour calculer une bbox avec la taille minimale
  const bounds = getBoundsOfDistance(
    { latitude: centerLat, longitude: centerLng },
    minSizeMeters / 2, // getBoundsOfDistance prend le rayon, pas le diamètre
  ) as [
    { latitude: number; longitude: number },
    { latitude: number; longitude: number },
  ];

  return {
    minLat: bounds[0].latitude,
    maxLat: bounds[1].latitude,
    minLng: bounds[0].longitude,
    maxLng: bounds[1].longitude,
  };
};
