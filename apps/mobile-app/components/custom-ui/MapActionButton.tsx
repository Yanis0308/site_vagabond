import {
  LocateFixedIcon,
  LocateIcon,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react-native";
import React, { memo, useCallback } from "react";

import { cn } from "@/utils/cn";

import { CompassIcon } from "../icons/CompassIcon";
import { Button, ButtonIcon } from "../ui/button";
import { themeColors } from "../ui/gluestack-ui-provider/config";

export type MapActionType =
  | { type: "locate"; onPress?: () => void; isCentered?: boolean }
  | { type: "compass"; onPress?: () => void; heading: number }
  | { type: "feedback"; onPress?: () => void }
  | { type: "filter"; onPress?: () => void };

interface MapActionButtonProps {
  action: MapActionType;
  className?: string;
}

export const MapActionButton = memo(function MapActionButton({
  action,
  className,
}: MapActionButtonProps): React.JSX.Element {
  const icon = useCallback(() => {
    switch (action.type) {
      case "locate":
        return action.isCentered ? (
          <LocateFixedIcon
            color={themeColors.burntOrange["700"].hex}
            size={32}
            strokeWidth={1.5}
          />
        ) : (
          <LocateIcon
            color={themeColors.burntOrange["700"].hex}
            size={32}
            strokeWidth={1.5}
          />
        );
      case "compass":
        return (
          <CompassIcon
            color={themeColors.burntOrange["700"].hex}
            size={32}
            rotation={action.heading - 45}
          />
        );
      case "filter":
        return (
          <SlidersHorizontal
            color={themeColors.burntOrange["700"].hex}
            size={32}
            strokeWidth={1.5}
          />
        );
      case "feedback":
        return (
          <TriangleAlert
            color={themeColors.burntOrange["700"].hex}
            size={32}
            strokeWidth={1.5}
          />
        );
      default:
        return null;
    }
  }, [action]);

  return (
    <Button
      onPress={action.onPress}
      action="mapAction"
      size="none"
      className={cn("border border-burntOrange-700", className)}
    >
      <ButtonIcon as={icon} />
    </Button>
  );
});

MapActionButton.displayName = "MapActionButton";
