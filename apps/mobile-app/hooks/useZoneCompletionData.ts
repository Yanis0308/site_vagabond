import type { ZoneUserStat } from "@vagabond/shared-utils";

import { useUserZoneStats } from "@/hooks/queries/useZonesStats";
import { getZoneState } from "@/utils/zoneState";

export const useZoneCompletionData = (): {
  completionData: Record<string, ZoneUserStat> | undefined;
  zonesByLevelAndState: Record<
    string,
    { completed: string[]; inProgress: string[]; unvisited: string[] }
  >;
  hasCompletionData: boolean;
} => {
  const { data: zonesData } = useUserZoneStats();
  const userZoneStats = zonesData?.zonesStats;

  const completionData = userZoneStats?.reduce<Record<string, ZoneUserStat>>(
    (acc, zone) => {
      const formattedZoneId = zone.zone_id.replace("OSM-", "");
      acc[formattedZoneId] = zone;
      return acc;
    },
    {},
  );

  const zonesByLevelAndState: Record<
    string,
    { completed: string[]; inProgress: string[]; unvisited: string[] }
  > = {};

  if (completionData !== undefined) {
    for (const [zoneId, zone] of Object.entries(completionData)) {
      const level = zone.boundary_level;
      zonesByLevelAndState[level] ??= {
        completed: [],
        inProgress: [],
        unvisited: [],
      };
      const state = getZoneState(zone);
      zonesByLevelAndState[level][state].push(zoneId);
    }
  }

  const hasCompletionData =
    completionData !== undefined && Object.keys(completionData).length > 0;

  return {
    completionData,
    zonesByLevelAndState,
    hasCompletionData,
  };
};
