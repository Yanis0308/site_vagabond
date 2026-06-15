import { router, useLocalSearchParams } from "expo-router";
import { type ReactElement, useEffect } from "react";

import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { ProfileContent } from "@/components/profile/ProfileContent";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { useUserPublicInfo } from "@/hooks/queries/useUserPublicInfo";
import { useUserZoneStats } from "@/hooks/queries/useZonesStats";
import { trackEvent } from "@/lib/analytics/analytics";

export default function UserProfilePage(): ReactElement | null {
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  useEffect(() => {
    if (userId === undefined) {
      router.dismiss();
    }
  }, [userId]);

  useEffect(() => {
    if (userId === undefined) return;
    void trackEvent("profile_viewed", {
      is_self: false,
      viewed_user_id: userId,
    });
  }, [userId]);

  const { data: userData } = useUserPublicInfo(userId);
  const { data: zonesData } = useUserZoneStats(userId);

  if (userId === undefined) {
    return null;
  }

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background["200"].hex}
      withHeader={true}
      isTabScreen={false}
    >
      <ProfileContent
        userData={userData}
        zonesStats={zonesData}
        showUserSpecificSections={false}
        allowVisitedPoiNavigation={false}
      />
    </CustomScreenContainer>
  );
}
