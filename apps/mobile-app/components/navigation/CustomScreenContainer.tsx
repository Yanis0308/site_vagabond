import { useNavigation } from "expo-router";
import { memo, type ReactNode, useEffect, useMemo } from "react";
import { View } from "react-native";
import { type Edge, SafeAreaView } from "react-native-safe-area-context";

import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";
import { cn } from "@/utils/cn";

import { Box } from "../ui/box";

interface CustomScreenContainerProps {
  children: ReactNode;
  isLightScreen: boolean;
  bgColor: string;
  withHeader: boolean;
  withTopSafeArea?: boolean;
  isTabScreen: boolean;
  className?: string;
}

export const CustomScreenContainer = memo(
  ({
    children,
    className,
    isLightScreen,
    bgColor,
    withHeader,
    withTopSafeArea = true,
    isTabScreen,
  }: CustomScreenContainerProps): ReactNode => {
    const navigation = useNavigation();
    const safeArea = useSafeAreaCustom();

    useEffect(() => {
      if (withHeader) {
        navigation.setOptions({
          headerShown: true,
          headerBackVisible: true,
          headerStyle: {
            backgroundColor: bgColor,
          },
          headerTintColor: isLightScreen ? "black" : "white",
        });
      }
    }, [navigation, withHeader, bgColor, isLightScreen]);

    // Tab screens: never include "bottom" in edges — we handle bottom spacing
    // manually via paddingBottom that accounts for the full tab bar height.
    // Non-tab screens: include "bottom" so SafeAreaView handles the device inset.
    const edges: Edge[] = useMemo(() => {
      const includeBottom = !isTabScreen;
      const includeTop = !withHeader && withTopSafeArea;

      const result: Edge[] = ["left", "right"];
      if (includeTop) result.push("top");
      if (includeBottom && (withHeader || withTopSafeArea))
        result.push("bottom");
      return result;
    }, [withHeader, withTopSafeArea, isTabScreen]);

    return (
      <Box className="flex-1" style={{ backgroundColor: bgColor }}>
        <SafeAreaView
          className={cn("flex-1", className)}
          edges={edges}
          style={{
            backgroundColor: bgColor,
            paddingBottom: isTabScreen ? safeArea.tabBarTotalHeight : 0,
          }}
        >
          {/* <StatusBar hidden={true} /> */}
          <View className={"flex-1"} style={{ backgroundColor: bgColor }}>
            {children}
          </View>
        </SafeAreaView>
      </Box>
    );
  },
);

CustomScreenContainer.displayName = "CustomScreenContainer";
