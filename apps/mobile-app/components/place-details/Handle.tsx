import { type BottomSheetHandleProps } from "@gorhom/bottom-sheet";
import React, { memo, useMemo } from "react";
import { Pressable } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Extrapolation } from "react-native-reanimated";

import { View } from "@/components/ui/view";

import { CloseIcon } from "../icons/CloseIcon";
import { themeColors } from "../ui/gluestack-ui-provider/config";
import { StarRating } from "../validate-place/StarRating";

interface HandleProps extends BottomSheetHandleProps {
  rating: number;
  onClose: () => void;
}

export const Handle = memo(
  ({ animatedIndex, rating, onClose }: HandleProps) => {
    const starRatingAnimatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        animatedIndex.value,
        [0, 1, 2],
        [1, 1, 0],
        Extrapolation.CLAMP,
      );

      return {
        opacity,
      };
    });

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
          className="absolute left-2 top-[-20px] z-10 rotate-[-4deg]"
        >
          {rating > 0 ? <StarRating rating={rating} size={15} /> : null}
        </Animated.View>

        <Pressable
          onPress={onClose}
          className="absolute right-2 top-2 z-10 rounded-full bg-background-400 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseIcon size={22} color={themeColors.burntOrange["500"].hex} />
        </Pressable>
      </Animated.View>
    );
  },
);

Handle.displayName = "Handle";
