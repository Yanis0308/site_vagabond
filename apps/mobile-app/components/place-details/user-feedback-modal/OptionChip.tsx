import { type ReactElement } from "react";
import { Pressable } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { cn } from "@/utils/cn";

interface OptionChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

export const OptionChip = ({
  label,
  isSelected,
  onPress,
}: OptionChipProps): ReactElement => {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "rounded-2xl border px-4 py-3",
        isSelected
          ? "border-primary-500 bg-primary-50"
          : "border-background-300 bg-background-50",
      )}
      onPress={onPress}
    >
      <CustomText
        className={cn(
          "text-sm",
          isSelected ? "text-primary-700" : "text-typography-700",
        )}
      >
        {label}
      </CustomText>
    </Pressable>
  );
};

OptionChip.displayName = "OptionChip";
