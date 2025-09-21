import { memo } from "react";
import { Path, Svg } from "react-native-svg";

import { themeColors } from "../ui/gluestack-ui-provider/config";

interface CloseIconProps {
  size?: number;
  color?: string;
}

export const CloseIcon = memo(
  ({ size = 24, color = themeColors.primary["400"].hex }: CloseIconProps) => {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M18 6 6 18" />
        <Path d="m6 6 12 12" />
      </Svg>
    );
  },
);

CloseIcon.displayName = "CloseIcon";
