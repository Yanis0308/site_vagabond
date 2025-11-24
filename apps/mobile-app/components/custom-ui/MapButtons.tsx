import React, { memo, useMemo } from "react";
import { View } from "react-native";

import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";
import { cn } from "@/utils/cn";

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
        className="absolute right-4 flex flex-col items-center justify-between"
        style={{
          bottom: safeAreaInsets.bottomWithTabBar + 250,
        }}
      >
        {/* Compass and Locate buttons grouped together at the top */}
        <View className="flex flex-col items-center gap-4">
          <View
            className={cn(
              "transition-opacity duration-300 ease-in-out",
              heading !== 0 ? "opacity-100" : "opacity-0",
            )}
            pointerEvents={heading !== 0 ? "auto" : "none"}
          >
            <MapActionButton action={compassAction} />
          </View>
          <MapActionButton action={locateAction} />
        </View>

        {/* Filter button at the bottom */}
        {onFilterPress !== undefined && (
          <MapActionButton action={filterAction} />
        )}
      </View>
    );
  },
);

MapButtons.displayName = "MapButtons";
