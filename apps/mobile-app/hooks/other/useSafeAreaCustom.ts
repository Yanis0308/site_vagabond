import { useMemo } from "react";
import {
  type EdgeInsets,
  // eslint-disable-next-line no-restricted-imports -- ok
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "@/app/(app)/(tabs)/_layout";

export const useSafeAreaCustom = (): EdgeInsets & {
  bottomWithTabBar: number;
} => {
  const insets = useSafeAreaInsets();

  return useMemo(
    () => ({
      ...insets,
      // 12 min for the tab bar padding bottom
      bottom: Math.max(insets.bottom, 12),
      bottomWithTabBar: insets.bottom + TAB_BAR_HEIGHT,
    }),
    [insets],
  );
};
