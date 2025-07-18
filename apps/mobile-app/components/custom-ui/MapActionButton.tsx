import {
  LocateFixedIcon,
  LocateIcon,
  SlidersHorizontal,
} from "lucide-react-native";
import React, { memo, useCallback } from "react";

import { cn } from "../..//utils/cn";
import { CompassIcon } from "../icons/CompassIcon";
import { Button, ButtonIcon } from "../ui/button";
import { themeColors } from "../ui/gluestack-ui-provider/config";

export type MapActionType =
  | { type: "locate"; onPress?: () => void; isCentered?: boolean }
  | { type: "compass"; onPress?: () => void; heading: number }
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
            strokeWidth={1.5}
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
      default:
        return null;
    }
  }, [action]);

  return (
    <Button
      onPress={action.onPress}
      className={cn(
        "rounded-full border-2 border-background-200 bg-background-100 p-2",
        className,
      )}
      size={"none"}
    >
      <ButtonIcon as={icon} className="size-8 text-burntOrange-700" />
    </Button>
  );
});

MapActionButton.displayName = "MapActionButton";
