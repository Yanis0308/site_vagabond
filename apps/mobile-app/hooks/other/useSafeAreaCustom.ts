import { useMemo } from "react";
import {
  type EdgeInsets,
  // eslint-disable-next-line no-restricted-imports -- ok
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "@/app/(app)/(tabs)/_layout";

interface SafeAreaCustom extends EdgeInsets {
  // Effective bottom inset used by the tab bar (device inset or 12px minimum)
  tabBarBottomInset: number;
  // Total height of the tab bar from the screen bottom edge (use for padding/positioning)
  tabBarTotalHeight: number;
}

// Minimum bottom inset applied to the tab bar on devices without a notch/home indicator,
// so tab bar icons don't sit flush against the screen edge.
const TAB_BAR_MIN_BOTTOM_INSET = 12;

export const useSafeAreaCustom = (): SafeAreaCustom => {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const tabBarBottomInset = Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_INSET);

    return {
      ...insets,
      tabBarBottomInset,
      tabBarTotalHeight: TAB_BAR_HEIGHT + tabBarBottomInset,
    };
  }, [insets]);
};
