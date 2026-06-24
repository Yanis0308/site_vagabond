"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";

import { PlaceVignette } from "@/components/explorer/place-vignette";
import { useUserGeolocation } from "@/hooks/use-user-geolocation";
import { formatDistanceKm } from "@/lib/geo/haversine-distance-km";
import { NEARBY_PLACES, type NearbyPlace } from "@/lib/nearby-places";

type DistanceStatus = "idle" | "loading" | "ready" | "error";

interface PlaceWithDistance extends NearbyPlace {
  distanceKm: number;
}

export function NearbyPlacesGrid(): ReactNode {
  const t = useTranslations("explorer");
  const { location, status: geoStatus } = useUserGeolocation();
  const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>("idle");
  const [placesWithDistance, setPlacesWithDistance] = useState<
    PlaceWithDistance[] | null
  >(null);

  useEffect(() => {
    if (location === null) {
      return;
    }

    let cancelled = false;

    async function fetchDistances(): Promise<void> {
      setDistanceStatus("loading");

      try {
        const response = await fetch("/api/nearby-distances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(location),
        });

        if (!response.ok) {
          throw new Error("nearby-distances failed");
        }

        const data = (await response.json()) as {
          places: Array<{ id: string; distanceKm: number }>;
        };

        if (cancelled) {
          return;
        }

        const sortedPlaces = data.places
          .map((entry) => {
            const place = NEARBY_PLACES.find((item) => item.id === entry.id);

            if (place === undefined) {
              return null;
            }

            return {
              ...place,
              distanceKm: entry.distanceKm,
            };
          })
          .filter((place): place is PlaceWithDistance => place !== null);

        setPlacesWithDistance(sortedPlaces);
        setDistanceStatus("ready");
      } catch {
        if (!cancelled) {
          setDistanceStatus("error");
        }
      }
    }

    void fetchDistances();

    return (): void => {
      cancelled = true;
    };
  }, [location]);

  const places = placesWithDistance ?? NEARBY_PLACES;

  function getSubtitle(place: NearbyPlace & { distanceKm?: number }): string {
    if (geoStatus === "pending" || distanceStatus === "loading") {
      return t("nearbyGeoLoading");
    }

    if (
      geoStatus === "unavailable" ||
      distanceStatus === "error" ||
      place.distanceKm === undefined
    ) {
      return t("nearbyGeoUnavailable");
    }

    return t("nearbyDistanceKm", {
      distance: formatDistanceKm(place.distanceKm),
    });
  }

  return (
    <div
      className="
        grid grid-cols-1 gap-4
        sm:grid-cols-2
        lg:grid-cols-3
      "
    >
      {places.map((place) => (
        <PlaceVignette
          key={place.id}
          title={place.name}
          subtitle={getSubtitle(place)}
          imageUrl={place.imageUrl}
        />
      ))}
    </div>
  );
}
