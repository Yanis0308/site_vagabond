"use client";

import { useEffect, useState } from "react";

export interface UserGeolocation {
  latitude: number;
  longitude: number;
}

export type GeolocationStatus = "pending" | "ready" | "unavailable";

interface UseUserGeolocationResult {
  location: UserGeolocation | null;
  status: GeolocationStatus;
  requestLocation: () => Promise<UserGeolocation | null>;
}

export function useUserGeolocation(): UseUserGeolocationResult {
  const [location, setLocation] = useState<UserGeolocation | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>("pending");

  function requestLocation(): Promise<UserGeolocation | null> {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        setStatus("unavailable");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextLocation: UserGeolocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(nextLocation);
          setStatus("ready");
          resolve(nextLocation);
        },
        () => {
          setStatus("unavailable");
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 60_000,
          timeout: 15_000,
        },
      );
    });
  }

  useEffect(() => {
    void requestLocation();
  }, []);

  return {
    location,
    status,
    requestLocation,
  };
}
