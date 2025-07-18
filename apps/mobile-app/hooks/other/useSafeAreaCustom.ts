import { useMemo } from "react";
import {
  type EdgeInsets,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { logger } from "@/utils/logger";

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
