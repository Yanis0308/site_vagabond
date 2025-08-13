import { useMemo } from "react";
import {
  type EdgeInsets,
  // eslint-disable-next-line no-restricted-imports -- ok
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export const useSafeAreaCustom = (): EdgeInsets => {
  const insets = useSafeAreaInsets();

  return useMemo(
    () => ({
      ...insets,
      // 12 min for the tab bar padding bottom
      bottom: Math.max(insets.bottom, 12),
    }),
    [insets],
  );
};
