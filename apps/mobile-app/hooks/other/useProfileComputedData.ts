import type { ZoneUserStat } from "@vagabond/shared-utils";
import { useMemo } from "react";

import {
  calculateRegionsProgress,
  calculateStats,
  sortRegionsByLatestPoiDate,
} from "@/components/profile";
import { useZoneHierarchy } from "@/hooks/other/useZoneHierarchy";

interface UseProfileComputedDataReturn {
  sortedHierarchy: ReturnType<typeof useZoneHierarchy>;
  stats: ReturnType<typeof calculateStats>;
  progress: ReturnType<typeof calculateRegionsProgress>;
}

export const useProfileComputedData = (
  zoneStats?: ZoneUserStat[],
): UseProfileComputedDataReturn => {
  const zoneHierarchy = useZoneHierarchy(zoneStats);

  // Trier la hiérarchie par dates
  const sortedHierarchy = useMemo(() => {
    return zoneHierarchy.map((country) => ({
      ...country,
      regions: sortRegionsByLatestPoiDate(country.regions),
    }));
  }, [zoneHierarchy]);

  const stats = useMemo(
    () => calculateStats(sortedHierarchy),
    [sortedHierarchy],
  );

  const progress = useMemo(
    () => calculateRegionsProgress(sortedHierarchy),
    [sortedHierarchy],
  );

  return {
    sortedHierarchy,
    stats,
    progress,
  };
};
