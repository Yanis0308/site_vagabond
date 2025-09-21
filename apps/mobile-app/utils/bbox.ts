// Constantes pour le clustering
export const CLUSTER_MAX_ZOOM = 14;
export const CLUSTER_RADIUS = 30;

// Constante pour la taille minimale de la bbox (10km en degrés approximatifs) - conservée pour compatibilité
export const MIN_BBOX_SIZE_DEGREES = 0.09; // ~10km

/**
 * Convertit une distance en mètres vers des degrés pour la latitude
 * 1 degré de latitude ≈ 111 320 mètres
 */
export const metersToLatDegrees = (meters: number): number => {
  return meters / 111320;
};

/**
 * Convertit une distance en mètres vers des degrés pour la longitude
 * à une latitude donnée. La formule prend en compte que les degrés
 * de longitude sont plus petits aux pôles.
 */
export const metersToLngDegrees = (
  meters: number,
  latitude: number,
): number => {
  const latRadians = (latitude * Math.PI) / 180;
  const metersPerDegreeLng = 111320 * Math.cos(latRadians);
  return meters / metersPerDegreeLng;
};

/**
 * Vérifie si une bounding box est entièrement contenue dans une autre
 * Note: Fonction conservée pour d'autres usages potentiels
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
 * Calcule une bbox avec une taille minimale configurable en mètres
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

  const currentLatDiff = northEast[1] - southWest[1];
  const currentLngDiff = northEast[0] - southWest[0];

  // Calculer la latitude moyenne pour les conversions
  const avgLat = (northEast[1] + southWest[1]) / 2;

  // Convertir la taille minimale en mètres vers des degrés
  const minLatSizeDegrees = metersToLatDegrees(minSizeMeters);
  const minLngSizeDegrees = metersToLngDegrees(minSizeMeters, avgLat);

  // Assurer une taille minimale
  const latDiff = Math.max(currentLatDiff, minLatSizeDegrees);
  const lngDiff = Math.max(currentLngDiff, minLngSizeDegrees);

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
