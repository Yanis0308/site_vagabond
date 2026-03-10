import React, { memo, type ReactElement } from "react";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";

interface MapDebugInfoProps {
  zoom: number;
}

export const MapDebugInfo = memo(
  ({ zoom }: MapDebugInfoProps): ReactElement => {
    const safeAreaInsets = useSafeAreaCustom();

    return (
      <View
        style={{
          position: "absolute",
          right: 10,
          bottom: safeAreaInsets.tabBarTotalHeight + 10,
          padding: 5,
          borderRadius: 5,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <CustomText className="text-xs text-white">
          {`Zoom: ${zoom.toFixed(1)}`}
        </CustomText>
      </View>
    );
  },
);

MapDebugInfo.displayName = "MapDebugInfo";
