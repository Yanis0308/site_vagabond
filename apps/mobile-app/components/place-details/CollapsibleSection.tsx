import { ChevronDown } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { cn } from "@/utils/cn";

interface CollapsibleSectionProps {
  title: string;
  emoji: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection = ({
  title,
  emoji,
  children,
  defaultOpen = false,
  className,
}: CollapsibleSectionProps): ReactNode => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const animatedRotation = useSharedValue(defaultOpen ? 180 : 0);
  const animatedHeight = useSharedValue(defaultOpen ? 1 : 0);

  const toggleOpen = (): void => {
    const newState = !isOpen;
    setIsOpen(newState);

    animatedRotation.value = withTiming(newState ? 180 : 0, {
      duration: 300,
    });

    animatedHeight.value = withTiming(newState ? 1 : 0, {
      duration: 300,
    });
  };

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animatedRotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: animatedHeight.value,
    maxHeight: animatedHeight.value === 0 ? 0 : 1000,
    overflow: "hidden",
  }));

  return (
    <Box className={cn("gap-1", className)}>
      <Pressable
        onPress={toggleOpen}
        className="
          flex-row items-center justify-between py-2
          active:opacity-70
        "
      >
        <Box className="flex-1 flex-row items-center gap-2">
          <CustomText type="ratingText" className="w-6 text-lg">
            {emoji}
          </CustomText>
          <CustomText className="flex-1 text-base font-bold text-primary-700">
            {title}
          </CustomText>
        </Box>
        <Animated.View style={iconStyle}>
          <ChevronDown color="#6D28D9" size={18} />
        </Animated.View>
      </Pressable>
      <Animated.View style={contentStyle}>
        <Box className="gap-1 rounded-2xl border border-background-300 bg-background-50 p-3">
          {children}
        </Box>
      </Animated.View>
    </Box>
  );
};
