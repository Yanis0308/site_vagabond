import { type ReactElement } from "react";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { shadowStyles } from "@/styles/shadows";

import { Box } from "../ui/box";
import { Spinner } from "../ui/spinner";

const DEFAULT_IMAGE_HEIGHT = 236;

export const PhotosLoadingPlaceholder = (): ReactElement => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
        true,
      ),
    };
  });

  return (
    <Box
      style={[shadowStyles.ratingBlock]}
      className="rotate-2 rounded-2xl bg-background-100 p-1.5"
    >
      <Animated.View
        style={[animatedStyle]}
        className="items-center justify-center rounded-2xl bg-background-200"
      >
        <Box
          style={{ height: DEFAULT_IMAGE_HEIGHT }}
          className="w-full items-center justify-center"
        >
          <Spinner size="large" className="text-primary-600" />
        </Box>
      </Animated.View>
    </Box>
  );
};
