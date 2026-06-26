import { type NextRequest, NextResponse } from "next/server";

import { haversineDistanceKm } from "@/lib/geo/haversine-distance-km";
import { NEARBY_PLACES } from "@/lib/nearby-places";
import { nearbyDistancesRequestSchema } from "@/lib/schemas/nearby-distances";
import { getDrivingDistancesKm } from "@/lib/services/get-driving-distances-km";

interface PlaceDistance {
  id: string;
  distanceKm: number;
}

type NearbyDistancesResponse =
  | { places: PlaceDistance[]; method: "driving" | "straight" }
  | { error: string };

export async function POST(
  request: NextRequest,
): Promise<NextResponse<NearbyDistancesResponse>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const parsed = nearbyDistancesRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const drivingDistances = await getDrivingDistancesKm(parsed.data);
  const method = drivingDistances !== null ? "driving" : "straight";

  const places: PlaceDistance[] = NEARBY_PLACES.map((place) => {
    const distanceKm =
      drivingDistances?.get(place.id) ??
      haversineDistanceKm(parsed.data, place);

    return {
      id: place.id,
      distanceKm,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  return NextResponse.json({ places, method });
}
