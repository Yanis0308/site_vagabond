import { StyleSheet } from "react-native";

import { themeColors } from "@/components/ui/gluestack-ui-provider/config";

/**
 * StyleSheet for shadows because Nativewind doesn't support box-shadow yet
 * https://github.com/nativewind/nativewind/discussions/1512
 */
const tabBar = {
  boxShadow: `0px 0px 12px 0px ${themeColors.shadow.polaroidBlock.hex}`,
};

export const shadowStyles = StyleSheet.create({
  // Button shadow
  buttonSubmit: {
    boxShadow: `0px 6px 0px 0px ${themeColors.primary["700"].hex}`,
  },

  // Custom shadows used in components
  ratingBlock: {
    boxShadow: `0px 4px 4px -2px ${themeColors.shadow.ratingBlock.hex}`,
  },

  polaroidBlock: {
    boxShadow: `0px 0px 12px 0px ${themeColors.shadow.polaroidBlock.hex}`,
  },

  // Large content shadow
  contentLarge: {
    boxShadow: `0px 24px 24px 0px ${themeColors.background["200"].hex}`,
  },

  // Tab bar shadow
  tabBar,

  // Tab bar Map shadow
  tabBarMap: {
    boxShadow: `${tabBar.boxShadow}, 0px 0px 7.3px 7px ${themeColors.primary["300"].hex} inset`,
  },
});
