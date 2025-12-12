import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { type ReactElement } from "react";
import { Keyboard } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { SearchHeader } from "@/components/search-bar/SearchHeader";
import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";

interface SearchHeaderButtonProps {
  bottomSheetAnimatedIndex?: SharedValue<number>;
}

export const SearchHeaderButton = ({
  bottomSheetAnimatedIndex,
}: SearchHeaderButtonProps): ReactElement => {
  const safeAreaInsets = useSafeAreaCustom();

  const containerAnimatedStyle = useAnimatedStyle(() => {
    // Calculate opacity based on bottom sheet state (inverse of backdrop)
    // Backdrop: [0, 1, 2] -> [0, 0, 0.3]
    // Search bar: [0, 1, 2] -> [1, 1, 0] (disappears at same rate backdrop appears)
    const opacity =
      bottomSheetAnimatedIndex !== undefined
        ? interpolate(
            bottomSheetAnimatedIndex.value,
            [0, 1, 2],
            [1, 1, 0],
            Extrapolation.CLAMP,
          )
        : 1;

    // Translate up when bottom sheet opens
    const translateY =
      bottomSheetAnimatedIndex !== undefined
        ? interpolate(
            bottomSheetAnimatedIndex.value,
            [0, 1, 2],
            [0, 0, -100],
            Extrapolation.CLAMP,
          )
        : 0;

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const handlePress = (): void => {
    // Navigate to search screen when the search bar is pressed
    // Since the input is not editable, we handle press instead of focus
    void router.push({
      pathname: "/search",
    });
  };

  // Ensure keyboard is dismissed when returning to this screen
  useFocusEffect(() => {
    // Don't clear searchTerm as it should display the selected result
    const timer = setTimeout(() => {
      Keyboard.dismiss();
    }, 100);
    return (): void => clearTimeout(timer);
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: safeAreaInsets.top + 16,
        },
        containerAnimatedStyle,
      ]}
    >
      <SearchHeader
        editable={false}
        placeholder="Rechercher sur la carte"
        onPress={handlePress}
      />
    </Animated.View>
  );
};
