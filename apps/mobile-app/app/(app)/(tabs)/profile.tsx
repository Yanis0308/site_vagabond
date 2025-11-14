import { FlashList } from "@shopify/flash-list";
import { type ReactElement, useCallback, useMemo } from "react";

import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileOverallProgress } from "@/components/profile/ProfileOverallProgress";
import { ProfileSignOutButton } from "@/components/profile/ProfileSignOutButton";
import { ProfileStatsGrid } from "@/components/profile/ProfileStatsGrid";
import { ProfileValidatedPlaces } from "@/components/profile/ProfileValidatedPlaces";
import {
  calculateRegionsProgress,
  calculateStats,
  type CountryType,
  type ProgressData,
  sortRegionsByLatestPoiDate,
  type Stats,
} from "@/components/profile/utils";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { useZoneHierarchy } from "@/hooks/other/useZoneHierarchy";
import { useUserZoneStats } from "@/hooks/queries/useZonesStats";

type ProfileSection =
  | { type: "header" }
  | { type: "progress"; data: ProgressData }
  | { type: "stats"; data: Stats }
  | { type: "validatedPlaces"; data: CountryType[] }
  | { type: "signOut" };

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
export default function ProfileScreen(): ReactElement {
  const { data: zonesData } = useUserZoneStats();
  const zoneHierarchy = useZoneHierarchy(zonesData?.zonesStats);

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

  const sections = useMemo<ProfileSection[]>(
    () => [
      { type: "header" },
      { type: "progress", data: progress },
      { type: "stats", data: stats },
      { type: "validatedPlaces", data: sortedHierarchy },
      { type: "signOut" },
    ],
    [progress, stats, sortedHierarchy],
  );

  const renderItem = useCallback(({ item }: { item: ProfileSection }) => {
    switch (item.type) {
      case "header":
        return (
          <Box className="px-4 pt-4">
            <ProfileHeader />
          </Box>
        );
      case "progress":
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
        return (
          <Box className="px-4">
            <ProfileStatsGrid stats={item.data} />
          </Box>
        );
      case "validatedPlaces":
        return (
          <Box className="px-4">
            <ProfileValidatedPlaces countries={item.data} />
          </Box>
        );
      case "signOut":
        return (
          <Box className="px-4 pb-4">
            <ProfileSignOutButton />
          </Box>
        );
      default:
        return null;
    }
  }, []);

  const keyExtractor = useCallback((item: ProfileSection, index: number) => {
    return `${item.type}-${index}`;
  }, []);

  const ItemSeparatorComponent = useCallback(() => {
    return <Box className="h-4" />;
  }, []);

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background["200"].hex}
      withHeader={false}
      isTabScreen={true}
    >
      <Box className="flex-1">
        <FlashList
          data={sections}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparatorComponent}
        />
      </Box>
    </CustomScreenContainer>
  );
}
