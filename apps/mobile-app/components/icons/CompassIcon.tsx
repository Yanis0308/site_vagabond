import React, { memo } from "react";
import Svg, { Circle, G, Path } from "react-native-svg";

import { themeColors } from "../ui/gluestack-ui-provider/config";

interface CompassIconProps {
  color?: string;
  size?: number;
  rotation?: number;
  strokeWidth?: number;
}

export const CompassIcon = memo(
  ({
    size = 24,
    color = themeColors.primary["400"].hex,
    rotation = 0,
    strokeWidth = 2,
  }: CompassIconProps): React.ReactNode => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G>
        <Circle
          cx={12}
          cy={12}
          r={11}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
        <Path
          d="M16.182 7.819c-.129-.128-.315-.178-.491-.127l-5.951 1.706c-.166.048-.295.177-.342.343l-1.707 5.951c-.051.175-.002.363.127.491.095.095.223.146.354.146l.138-.20 5.95-1.708c.165-.047.295-.177.342-.343l1.707-5.949c.05-.173.002-.361-.127-.49zm-7.282 7.282l1.383-4.817 3.434 3.435-4.817 1.382z"
          fill={color}
          transform={`rotate(${rotation} 12 12)`}
        />
      </G>
    </Svg>
  ),
);

CompassIcon.displayName = "CompassIcon";
