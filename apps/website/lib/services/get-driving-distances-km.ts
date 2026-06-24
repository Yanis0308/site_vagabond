import "server-only";

import { NEARBY_PLACES } from "@/lib/nearby-places";

const OSRM_TABLE_URL = "https://router.project-osrm.org/table/v1/driving";

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface OsrmTableResponse {
  code: string;
  distances?: number[][];
}

export async function getDrivingDistancesKm(
  userLocation: UserLocation,
): Promise<Map<string, number> | null> {
  const coordinates = [
    `${userLocation.longitude},${userLocation.latitude}`,
    ...NEARBY_PLACES.map((place) => `${place.longitude},${place.latitude}`),
  ].join(";");

  const url = `${OSRM_TABLE_URL}/${coordinates}?sources=0&annotations=distance`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as OsrmTableResponse;

    if (data.code !== "Ok" || data.distances?.[0] === undefined) {
      return null;
    }

    const row = data.distances[0];
    const distances = new Map<string, number>();

    NEARBY_PLACES.forEach((place, index) => {
      const meters = row[index + 1];

      if (typeof meters === "number" && Number.isFinite(meters)) {
        distances.set(place.id, meters / 1000);
      }
    });

    if (distances.size !== NEARBY_PLACES.length) {
      return null;
    }

    return distances;
  } catch {
    return null;
  }
}
