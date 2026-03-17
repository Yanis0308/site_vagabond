import { FlashList } from "@shopify/flash-list";
import type { UserMe, ZoneUserStat } from "@vagabond/shared-utils";
import { type ReactElement, useCallback, useMemo } from "react";
import { type Optional } from "utility-types";

import { ProfileDeleteAccountButton } from "@/components/profile/ProfileDeleteAccountButton";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileOverallProgress } from "@/components/profile/ProfileOverallProgress";
import { ProfileSignOutButton } from "@/components/profile/ProfileSignOutButton";
import { ProfileStatsGrid } from "@/components/profile/ProfileStatsGrid";
import { ProfileValidatedPlaces } from "@/components/profile/ProfileValidatedPlaces";
import type {
  CountryType,
  ProgressData,
  Stats,
} from "@/components/profile/utils";
import { Box } from "@/components/ui/box";
import { Spinner } from "@/components/ui/spinner";
import { useProfileComputedData } from "@/hooks/other/useProfileComputedData";
import { useUsersMe } from "@/hooks/queries/useUsersMe";

type ProfileSection =
  | { type: "header" }
  | { type: "progress"; data: ProgressData }
  | { type: "stats"; data: Stats }
  | { type: "validatedPlaces"; data: CountryType[] }
  | { type: "signOut" }
  | { type: "deleteAccount" };

interface ProfileContentProps {
  userData?: Optional<
    Pick<UserMe, "id" | "fullName" | "nickname" | "email" | "createdAt">,
    "email"
  > | null;
  zonesStats?: ZoneUserStat[];
  showSignOutButton: boolean;
  allowVisitedPoiNavigation: boolean;
}

export function ProfileContent({
  userData,
  zonesStats,
  showSignOutButton,
  allowVisitedPoiNavigation,
}: ProfileContentProps): ReactElement {
  const { data: currentUser } = useUsersMe();
  const allowProfileEdit = userData?.id === currentUser?.id;
  const { sortedHierarchy, stats, progress } =
    useProfileComputedData(zonesStats);

  const sections = useMemo<ProfileSection[]>(() => {
    const baseSections: ProfileSection[] = [
      { type: "header" },
      { type: "progress", data: progress },
      { type: "stats", data: stats },
      { type: "validatedPlaces", data: sortedHierarchy },
    ];

    if (showSignOutButton) {
      baseSections.push({ type: "signOut" });
      baseSections.push({ type: "deleteAccount" });
    }

    return baseSections;
  }, [progress, stats, sortedHierarchy, showSignOutButton]);

  const renderItem = useCallback(
    ({ item }: { item: ProfileSection }) => {
      switch (item.type) {
        case "header":
          return (
            <Box className="px-4 pt-4">
              <ProfileHeader
                userData={userData}
                allowProfileEdit={allowProfileEdit}
              />
            </Box>
          );
        case "progress":
          if (zonesStats === undefined) {
            return <Spinner />;
          }
          return (
            <Box className="px-4">
              <ProfileOverallProgress
                percentage={item.data.percentage}
                visited={item.data.visited}
                total={item.data.total}
              />
            </Box>
          );
        case "stats":
          if (zonesStats === undefined) return null;
          return (
            <Box className="px-4">
              <ProfileStatsGrid stats={item.data} />
            </Box>
          );
        case "validatedPlaces":
          if (zonesStats === undefined) return null;
          return (
            <Box className="px-4">
              <ProfileValidatedPlaces
                countries={item.data}
                allowVisitedPoiNavigation={allowVisitedPoiNavigation}
                allowProfileEdit={allowProfileEdit}
              />
            </Box>
          );
        case "signOut":
          return (
            <Box className="px-4">
              <ProfileSignOutButton />
            </Box>
          );
        case "deleteAccount":
          return (
            <Box className="px-4">
              <ProfileDeleteAccountButton />
            </Box>
          );
        default:
          return null;
      }
    },
    [userData, allowProfileEdit, zonesStats, allowVisitedPoiNavigation],
  );

  const keyExtractor = useCallback((item: ProfileSection, index: number) => {
    return `${item.type}-${index}`;
  }, []);

  const ItemSeparatorComponent = useCallback(() => {
    return <Box className="h-4" />;
  }, []);

  return (
    <Box className="flex-1">
      <FlashList
        data={sections}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparatorComponent}
      />
    </Box>
  );
}
