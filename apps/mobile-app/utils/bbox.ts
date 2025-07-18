// Constantes pour le clustering
export const CLUSTER_MAX_ZOOM = 14;
export const CLUSTER_RADIUS = 30;

// Constante pour la taille minimale de la bbox (10km en degrés approximatifs)
export const MIN_BBOX_SIZE_DEGREES = 0.09; // ~10km

// Type pour représenter une bounding box avec les données associées
export interface CachedBoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  timestamp: number; // Pour un éventuel nettoyage du cache
}

/**
 * Vérifie si une bounding box est entièrement contenue dans une autre
 */
export const isBboxContainedIn = (
  innerBbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  },
  outerBbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  },
): boolean => {
  return (
    innerBbox.minLat >= outerBbox.minLat &&
    innerBbox.maxLat <= outerBbox.maxLat &&
    innerBbox.minLng >= outerBbox.minLng &&
    innerBbox.maxLng <= outerBbox.maxLng
  );
};

/**
 * Trouve la première bounding box cachée qui contient la bbox demandée
 */
export const findContainingCachedBbox = (
  requestedBbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  },
  cachedBboxes: CachedBoundingBox[],
): CachedBoundingBox | null => {
  return (
    cachedBboxes.find((cachedBbox) =>
      isBboxContainedIn(requestedBbox, cachedBbox),
    ) ?? null
  );
};

/**
 * Convertit une bounding box en clé unique pour le cache
 */
export const bboxToKey = (bbox: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}): string => {
  return `${bbox.minLat.toFixed(6)}_${bbox.maxLat.toFixed(6)}_${bbox.minLng.toFixed(6)}_${bbox.maxLng.toFixed(6)}`;
};

/**
 * Calcule une bbox avec une taille minimale de 10km x 10km
 */
export const calculateBboxWithMinSize = (
  northEast: GeoJSON.Position,
  southWest: GeoJSON.Position,
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

  const currentLatDiff = northEast[1] - southWest[1];
  const currentLngDiff = northEast[0] - southWest[0];

  // Calculer la taille minimale en degrés pour la longitude basée sur la latitude moyenne
  const avgLat = (northEast[1] + southWest[1]) / 2;
  const minLngSize = MIN_BBOX_SIZE_DEGREES / Math.cos((avgLat * Math.PI) / 180);

  // Assurer une taille minimale
  const latDiff = Math.max(currentLatDiff, MIN_BBOX_SIZE_DEGREES);
  const lngDiff = Math.max(currentLngDiff, minLngSize);

  // Calculer le centre
  const centerLat = (northEast[1] + southWest[1]) / 2;
  const centerLng = (northEast[0] + southWest[0]) / 2;

  // Calculer les nouvelles bounds
  const halfLatDiff = latDiff / 2;
  const halfLngDiff = lngDiff / 2;

  return {
    minLat: centerLat - halfLatDiff,
    maxLat: centerLat + halfLatDiff,
    minLng: centerLng - halfLngDiff,
    maxLng: centerLng + halfLngDiff,
  };
};
