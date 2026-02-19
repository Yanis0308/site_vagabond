import { useMemo } from "react";

import {
  calculateRegionsProgress,
  calculateStats,
  sortRegionsByLatestPoiDate,
} from "@/components/profile";
import { useZoneHierarchy } from "@/hooks/other/useZoneHierarchy";
import type { ZoneUserStatType } from "@/utils/types";

interface UseProfileComputedDataReturn {
  sortedHierarchy: ReturnType<typeof useZoneHierarchy>;
  stats: ReturnType<typeof calculateStats>;
  progress: ReturnType<typeof calculateRegionsProgress>;
}

export const useProfileComputedData = (
  zoneStats?: ZoneUserStatType[],
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
