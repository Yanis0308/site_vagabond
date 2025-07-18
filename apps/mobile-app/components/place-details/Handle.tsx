import { type BottomSheetHandleProps } from "@gorhom/bottom-sheet";
import React, { memo, useMemo } from "react";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Extrapolation } from "react-native-reanimated";

import { View } from "@/components/ui/view";

import { themeColors } from "../ui/gluestack-ui-provider/config";
import { StarRating } from "../validate-place/StarRating";

interface HandleProps extends BottomSheetHandleProps {
  rating: number;
}

export const Handle = memo(({ animatedIndex, rating }: HandleProps) => {
  const starRatingAnimatedStyle = useAnimatedStyle(
    // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- mandatory for animation
    () => {
      const opacity = interpolate(
        animatedIndex.value,
        [0, 1, 2],
        [1, 1, 0],
        Extrapolation.CLAMP,
      );

      return {
        opacity,
      };
    },
  );

  const containerStyle = useMemo(
    () => [
      {
        backgroundColor: themeColors.background["200"].hex,
        borderWidth: 2,
        borderBottomWidth: 0,
        borderColor: themeColors.burntOrange["200"].hex,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        display: "flex" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        paddingVertical: 10,
        marginHorizontal: -2,
      },
    ],
    [],
  );

  const indicatorStyle = useMemo(
    () => ({
      height: 6,
      borderRadius: 8,
      borderTopWidth: 2,
      borderTopColor: themeColors.burntOrange["200"].hex,
      backgroundColor: themeColors.burntOrange["100"].hex,
    }),
    [],
  );

  return (
    <Animated.View style={containerStyle}>
      <View style={[indicatorStyle]} className="w-[20vw]" />
      <Animated.View
        style={starRatingAnimatedStyle}
        className="absolute right-2 top-[-20px] z-10 rotate-[-4deg]"
      >
        <StarRating rating={rating} size={15} />
      </Animated.View>
    </Animated.View>
  );
});

Handle.displayName = "Handle";
