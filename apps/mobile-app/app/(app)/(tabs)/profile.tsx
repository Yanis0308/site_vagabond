import { type ReactElement, useEffect } from "react";

import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { ProfileContent } from "@/components/profile/ProfileContent";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { useUserZoneStats } from "@/hooks/queries/useZonesStats";
import { trackEvent } from "@/lib/analytics/analytics";

export default function ProfileScreen(): ReactElement {
  const { data: userData } = useUsersMe();
  const { data: zonesData } = useUserZoneStats();

  useEffect(() => {
    if (userData?.id === undefined) return;
    void trackEvent("profile_viewed", {
      is_self: true,
      viewed_user_id: userData.id,
    });
  }, [userData?.id]);

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background["200"].hex}
      withHeader={false}
      isTabScreen={true}
    >
      <ProfileContent
        userData={userData}
        zonesStats={zonesData?.zonesStats}
        showSignOutButton={true}
        allowVisitedPoiNavigation={true}
      />
    </CustomScreenContainer>
  );
}
