import { type ReactElement, type ReactNode } from "react";
import { Keyboard, Pressable, View } from "react-native";

interface KeyboardDismissPressableProps {
  children: ReactNode;
  onDismiss?: () => void;
}

/**
 * KeyboardDismissPressable component that dismisses the keyboard when tapping outside TextInputs
 * Simplified version that uses Pressable for better compatibility
 *
 * This component:
 * - Dismisses keyboard when tapping outside TextInputs
 * - Allows child buttons to work normally while still dismissing the keyboard
 */
export const KeyboardDismissPressable = ({
  children,
  onDismiss,
}: KeyboardDismissPressableProps): ReactElement => {
  const handlePress = (): void => {
    Keyboard.dismiss();
    onDismiss?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{ flex: 1 }}
      accessible={false}
      // Important: allow touches to pass through to children
      // Children will handle their own press events first
    >
      <View style={{ flex: 1 }} pointerEvents="box-none">
        {children}
      </View>
    </Pressable>
  );
};
