import React, { memo } from "react";
import Svg, { Circle } from "react-native-svg";

import { themeColors } from "../ui/gluestack-ui-provider/config";

interface TakePhotoIconProps {
  color?: string;
  size?: number;
}

export const TakePhotoIcon = memo(
  ({
    size = 20,
    color = themeColors.primary["400"].hex,
  }: TakePhotoIconProps): React.ReactNode => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="24" fill={color} />
    </Svg>
  ),
);

TakePhotoIcon.displayName = "TakePhotoIcon";
