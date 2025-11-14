import { memo, type ReactElement } from "react";

import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";

import { ProfileStatsCard } from "./ProfileStatsCard";
import type { Stats } from "./utils";

interface ProfileStatsGridProps {
  stats: Stats;
}

export const ProfileStatsGrid = memo(
  ({ stats }: ProfileStatsGridProps): ReactElement => {
    return (
      <VStack className="gap-3">
        <HStack className="gap-3">
          <ProfileStatsCard
            label="Lieux visités"
            value={stats.visitedPlaces}
            emoji="📍"
            lastVisitedDate={stats.lastVisitedDate}
            lastVisitedPlaceName={stats.lastVisitedPlaceName}
          />
        </HStack>
        <HStack className="gap-3">
          <ProfileStatsCard
            label="Départements"
            value={stats.departements}
            emoji="🏛️"
            total={stats.totalDepartements}
          />
          <ProfileStatsCard label="Villes" value={stats.cities} emoji="🏙️" />
        </HStack>
      </VStack>
    );
  },
);

ProfileStatsGrid.displayName = "ProfileStatsGrid";
