import {
  bboxToKey,
  type CachedBoundingBox,
  findContainingCachedBbox,
} from "@/utils/bbox";
import { logger } from "@/utils/logger";
import { type PoiType } from "@/utils/types";

interface CachedPlacesData {
  places: PoiType[];
  bbox: CachedBoundingBox;
}

/**
 * Gestionnaire de cache intelligent pour les places
 * Évite les requêtes redondantes en vérifiant si une zone est déjà couverte par le cache
 */
class PlacesCacheManager {
  private cachedData: Map<string, CachedPlacesData> = new Map<
    string,
    CachedPlacesData
  >();
  private loadedBboxes: CachedBoundingBox[] = [];

  /**
   * Vérifie si une bounding box est déjà couverte par le cache
   */
  isBboxCovered(bbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }): boolean {
    const containingBbox = findContainingCachedBbox(bbox, this.loadedBboxes);
    return containingBbox !== null;
  }

  /**
   * Récupère les places pour une bounding box depuis le cache
   * Retourne les places filtrées pour la bbox demandée si elle est contenue dans une zone chargée
   */
  getCachedPlaces(bbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }): PoiType[] | null {
    const containingBbox = findContainingCachedBbox(bbox, this.loadedBboxes);

    if (containingBbox === null) {
      return null;
    }

    const cacheKey = bboxToKey(containingBbox);
    const cachedData = this.cachedData.get(cacheKey);

    if (cachedData === undefined) {
      logger("Cache inconsistency: bbox found but no data", {
        containingBbox,
        cacheKey,
      });
      return null;
    }

    // Filtrer les places pour ne retourner que celles dans la bbox demandée
    const filteredPlaces = cachedData.places.filter((place) => {
      const { latitude, longitude } = place.coords;
      return (
        latitude >= bbox.minLat &&
        latitude <= bbox.maxLat &&
        longitude >= bbox.minLng &&
        longitude <= bbox.maxLng
      );
    });

    logger("Using cached places", {
      requestedBbox: bbox,
      containingBbox,
      totalCachedPlaces: cachedData.places.length,
      filteredPlaces: filteredPlaces.length,
    });

    return filteredPlaces;
  }

  /**
   * Ajoute des places au cache pour une bounding box donnée
   */
  setCachedPlaces(
    bbox: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    },
    places: PoiType[],
  ): void {
    const cachedBbox: CachedBoundingBox = {
      ...bbox,
      timestamp: Date.now(),
    };

    const cacheKey = bboxToKey(bbox);

    this.cachedData.set(cacheKey, {
      places,
      bbox: cachedBbox,
    });

    // Ajouter la bbox à la liste des zones chargées si elle n'y est pas déjà
    const existingBbox = this.loadedBboxes.find(
      (existing) => bboxToKey(existing) === cacheKey,
    );

    if (existingBbox === undefined) {
      this.loadedBboxes.push(cachedBbox);
    }

    logger("Cached places for bbox", {
      bbox,
      placesCount: places.length,
      totalCachedAreas: this.loadedBboxes.length,
    });
  }

  /**
   * Vide le cache (utile pour les tests ou en cas de problème)
   */
  clearCache(): void {
    this.cachedData.clear();
    this.loadedBboxes = [];
    logger("Places cache cleared");
  }

  /**
   * Retourne des informations de debug sur l'état du cache
   */
  getCacheInfo(): {
    totalCachedAreas: number;
    totalCachedPlaces: number;
    loadedBboxes: CachedBoundingBox[];
  } {
    const totalCachedPlaces = Array.from(this.cachedData.values()).reduce(
      (total, data) => total + data.places.length,
      0,
    );

    return {
      totalCachedAreas: this.loadedBboxes.length,
      totalCachedPlaces,
      loadedBboxes: [...this.loadedBboxes],
    };
  }
}

// Instance singleton du gestionnaire de cache
export const placesCacheManager = new PlacesCacheManager();
