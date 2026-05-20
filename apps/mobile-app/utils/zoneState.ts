import type { ZoneUserStatV2 } from "@vagabond/shared-utils";

export type ZoneState = "unvisited" | "inProgress" | "completed";

/**
 * Determines zone state based on user statistics (schema v2).
 */
export function getZoneState(zone: ZoneUserStatV2): ZoneState {
  const hasVisitedPois = zone.visited_pois_count > 0;
  const hasCompletedSubzones = zone.completed_subzones_count > 0;

  if (!hasVisitedPois && !hasCompletedSubzones) {
    return "unvisited";
  }

  const allPoisCompleted = zone.visited_pois_count >= zone.total_pois_count;
  const allSubzonesCompleted =
    zone.total_subzones_count === 0 ||
    (zone.total_subzones_count > 0 &&
      zone.completed_subzones_count === zone.total_subzones_count);

  if (allPoisCompleted && allSubzonesCompleted) {
    return "completed";
  }

  return "inProgress";
}
