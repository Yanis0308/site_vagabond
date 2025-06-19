import React, { memo } from "react";
import Svg, { Path } from "react-native-svg";

import { themeColors } from "../ui/gluestack-ui-provider/config";

interface SwitchCameraIconProps {
  color?: string;
  size?: number;
}

export const SwitchCameraIcon = memo(
  ({
    size = 20,
    color = themeColors.primary["400"].hex,
  }: SwitchCameraIconProps): React.ReactNode => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Path
        d="M4.8763 20.2562C4.18933 20.3246 3.68787 20.9369 3.75624 21.6238C4.57388 29.8391 11.5194 36.25 19.9629 36.25C24.503 36.25 28.903 34.6946 32.0269 31.7819L35 34.75C35.6904 34.75 36.25 34.1903 36.25 33.5V26.9C36.25 25.7096 35.2835 24.75 34.0978 24.75H27.4815C26.7911 24.75 26.2315 25.3096 26.2315 26L30.2532 30.0123C27.6565 32.4001 23.9537 33.75 19.9629 33.75C12.812 33.75 6.93512 28.3208 6.24395 21.3762C6.17558 20.6893 5.56326 20.1878 4.8763 20.2562Z"
        fill={color}
      />
      <Path
        d="M36.2439 18.3762C35.4262 10.1609 28.4808 3.75 20.0373 3.75C15.4971 3.75 11.0971 5.30541 7.97313 8.2181L5.00013 5.25004C4.30978 5.25004 3.75013 5.80968 3.75013 6.50004V13.1C3.75013 14.2903 4.71654 15.25 5.90236 15.25H12.5187C13.209 15.25 13.7687 14.6904 13.7687 14L9.74739 9.98727C12.3441 7.59975 16.0467 6.25 20.0373 6.25C27.1881 6.25 33.065 11.6792 33.7562 18.6238C33.8245 19.3108 34.4369 19.8122 35.1238 19.7439C35.8108 19.6755 36.3123 19.0632 36.2439 18.3762Z"
        fill={color}
      />
    </Svg>
  ),
);

SwitchCameraIcon.displayName = "SwitchCameraIcon";
