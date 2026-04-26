import { type DbRepositories } from "@vagabond/api-utils";
import {
  type BoundaryLevelEnum,
  type StaffToolsBoundaryLevel,
} from "@vagabond/shared-utils";

function roundRobinSelect(groups: string[][], count: number): string[] {
  const selected: string[] = [];
  const queues = groups.map((g) => [...g]);

  while (selected.length < count) {
    let advanced = false;
    for (const queue of queues) {
      if (selected.length >= count) break;
      const poiId = queue.shift();
      if (poiId !== undefined) {
        selected.push(poiId);
        advanced = true;
      }
    }
    if (!advanced) break;
  }

  return selected;
}

function staffToolsBoundaryLevelToDbLevel(
  level: StaffToolsBoundaryLevel,
): BoundaryLevelEnum {
  return level;
}

function subLevelFor(level: StaffToolsBoundaryLevel): BoundaryLevelEnum | null {
  if (level === "REGION") return "COUNTY";
  if (level === "COUNTY") return "CITY";
  return null;
}

export function randomImageKey(): string {
  const n = Math.floor(Math.random() * 1000) + 1;
  return String(n).padStart(4, "0") + ".png";
}

export async function completeZone(
  poiId: string,
  boundaryLevel: StaffToolsBoundaryLevel,
  targetPercentage: number,
  staffUserId: string,
  repositories: DbRepositories,
): Promise<{ addedCount: number; removedCount: number }> {
  const dbLevel = staffToolsBoundaryLevelToDbLevel(boundaryLevel);

  const boundaryId = await repositories.boundary.findIdForPoiAtLevel(
    poiId,
    dbLevel,
  );

  if (boundaryId === undefined) {
    throw new Error(
      `No boundary found for POI ${poiId} at level ${boundaryLevel}`,
    );
  }

  const allPoiIds =
    // eslint-disable-next-line no-restricted-syntax -- staff-tools service is a legitimate consumer of the staffTools repository
    await repositories.staffTools.findPoiIdsByBoundaryId(boundaryId);
  const totalCount = allPoiIds.length;

  if (totalCount === 0) {
    return { addedCount: 0, removedCount: 0 };
  }

  const requiredCount = Math.ceil((targetPercentage / 100) * totalCount);

  const currentValidations =
    // eslint-disable-next-line no-restricted-syntax -- staff-tools service is a legitimate consumer of the staffTools repository
    await repositories.staffTools.findValidationsForPoiIds(
      staffUserId,
      allPoiIds,
    );
  const currentCount = currentValidations.length;

  let addedCount = 0;
  let removedCount = 0;

  if (requiredCount < currentCount) {
    const toRemove = currentValidations
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, currentCount - requiredCount);

    // eslint-disable-next-line no-restricted-syntax -- staff-tools service is a legitimate consumer of the staffTools repository
    await repositories.staffTools.deleteVisitedPoisByIds(
      toRemove.map((v) => v.id),
    );
    removedCount = toRemove.length;
  } else if (requiredCount > currentCount) {
    const toAddCount = requiredCount - currentCount;
    const alreadyValidated = new Set(currentValidations.map((v) => v.poiId));
    const unvalidated = allPoiIds.filter((id) => !alreadyValidated.has(id));

    const subLevel = subLevelFor(boundaryLevel);
    let selectedPoiIds: string[];

    if (subLevel !== null) {
      const grouped =
        // eslint-disable-next-line no-restricted-syntax -- staff-tools service is a legitimate consumer of the staffTools repository
        await repositories.staffTools.findPoiIdsByBoundaryGroupedBySubBoundary(
          boundaryId,
          subLevel,
        );

      const unvalidatedSet = new Set(unvalidated);
      const filteredGroups = grouped
        .map((g) => g.poiIds.filter((id) => unvalidatedSet.has(id)))
        .filter((g) => g.length > 0);

      selectedPoiIds = roundRobinSelect(filteredGroups, toAddCount);

      // If groups don't cover all needed (some POIs not in sub-zones), fill from remaining - should never happen
      if (selectedPoiIds.length < toAddCount) {
        const selectedSet = new Set(selectedPoiIds);
        const remaining = unvalidated.filter((id) => !selectedSet.has(id));
        selectedPoiIds.push(
          ...remaining.slice(0, toAddCount - selectedPoiIds.length),
        );
      }
    } else {
      selectedPoiIds = unvalidated.slice(0, toAddCount);
    }

    for (const targetPoiId of selectedPoiIds) {
      const coords = await repositories.poi.findCoordsById(targetPoiId);
      if (coords === undefined) continue;

      await repositories.visitedPoi.createCustom({
        poiId: targetPoiId,
        userId: staffUserId,
        coords: { latitude: coords.latitude, longitude: coords.longitude },
        imageKey: randomImageKey(),
        imageSource: "CAMERA",
        rating: 5,
        comment: "",
      });

      addedCount++;
    }
  }

  return { addedCount, removedCount };
}
