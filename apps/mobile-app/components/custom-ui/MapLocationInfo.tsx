import { memo, type ReactElement } from "react";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";

interface MapLocationInfoProps {
  zoneName: string | null;
}

export const MapLocationInfo = memo(
  ({ zoneName }: MapLocationInfoProps): ReactElement | null => {
    const safeAreaInsets = useSafeAreaCustom();

    if (zoneName === null) {
      return null;
    }

    return (
      <View
        style={{
          position: "absolute",
          left: 10,
          bottom: safeAreaInsets.tabBarTotalHeight + 10,
          padding: 5,
          paddingHorizontal: 10,
          borderRadius: 5,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <CustomText className="text-xs text-white">{zoneName}</CustomText>
      </View>
    );
  },
);

MapLocationInfo.displayName = "MapLocationInfo";
