import { useMemo } from "react";
import {
  type EdgeInsets,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export const useSafeAreaCustom = (): EdgeInsets => {
  const insets = useSafeAreaInsets();

  return useMemo(
    () => ({
      ...insets,
      bottom: Math.max(insets.bottom, 12),
    }),
    [insets],
  );
};
