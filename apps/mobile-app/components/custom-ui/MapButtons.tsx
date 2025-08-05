import React, { memo, useMemo } from "react";
import { View } from "react-native";

import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";

import { MapActionButton } from "./MapActionButton";

interface MapButtonsProps {
  onLocatePress?: () => void;
  onCompassPress?: () => void;
  onFilterPress?: () => void;
  isCentered?: boolean;
  heading?: number;
}

export const MapButtons = memo(
  ({
    onLocatePress,
    onCompassPress,
    onFilterPress,
    isCentered = false,
    heading = 0,
  }: MapButtonsProps) => {
    const safeAreaInsets = useSafeAreaCustom();

    const compassAction = useMemo(
      () => ({
        type: "compass" as const,
        onPress: onCompassPress,
        heading: heading,
      }),
      [onCompassPress, heading],
    );

    const locateAction = useMemo(
      () => ({
        type: "locate" as const,
        onPress: onLocatePress,
        isCentered: isCentered,
      }),
      [isCentered, onLocatePress],
    );

    const filterAction = useMemo(
      () => ({
        type: "filter" as const,
        onPress: onFilterPress,
      }),
      [onFilterPress],
    );

    return (
      <View
        className="absolute inset-y-0 right-4 flex flex-col items-center justify-between gap-4"
        style={{
          paddingTop: safeAreaInsets.top + 100,
          paddingBottom: 200,
        }}
      >
        <MapActionButton action={compassAction} />

        <MapActionButton action={locateAction} />

        {onFilterPress !== undefined && (
          <MapActionButton action={filterAction} />
        )}
      </View>
    );
  },
);

MapButtons.displayName = "MapButtons";
