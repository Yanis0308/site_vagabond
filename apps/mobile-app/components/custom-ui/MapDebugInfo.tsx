import React, { memo, type ReactElement } from "react";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";

interface MapDebugInfoProps {
  zoom: number;
  placesCount: number;
}

export const MapDebugInfo = memo(
  ({ zoom, placesCount }: MapDebugInfoProps): ReactElement => {
    return (
      <View
        style={{
          position: "absolute",
          top: 100,
          left: 10,
          padding: 5,
          borderRadius: 5,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        }}
      >
        <CustomText className="text-xs text-white">
          {`Zoom: ${zoom.toFixed(1)}`}
        </CustomText>
        <CustomText className="text-xs text-white">
          {`Lieux: ${placesCount}`}
        </CustomText>
      </View>
    );
  },
);

MapDebugInfo.displayName = "MapDebugInfo";
