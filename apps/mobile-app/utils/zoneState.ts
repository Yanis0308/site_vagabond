import type { ZoneUserStat } from "@vagabond/shared-utils";

export type ZoneState = "unvisited" | "inProgress" | "completed";

/**
 * Determines zone state based on user statistics
 */
export function getZoneState(zone: ZoneUserStat): ZoneState {
  const hasVisitedPois = zone.validated_pois_count > 0;
  const hasCompletedSubzones = zone.completed_subzones_count > 0;

  // Unvisited: no POI visited and no subzone completed
  if (!hasVisitedPois && !hasCompletedSubzones) {
    return "unvisited";
  }

  // Completed: all POIs visited AND all subzones completed (if applicable)
  const allPoisCompleted = zone.validated_pois_count >= zone.total_pois_count;
  const allSubzonesCompleted =
    zone.total_subzones_count === 0 ||
    (zone.total_subzones_count > 0 &&
      zone.completed_subzones_count === zone.total_subzones_count);

  if (allPoisCompleted && allSubzonesCompleted) {
    return "completed";
  }

  // In progress: at least one POI visited or one subzone completed
  return "inProgress";
}
