import { useNavigation } from "expo-router";
import { memo, type ReactNode, useEffect, useMemo } from "react";
import { View } from "react-native";
import { type Edge, SafeAreaView } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "@/app/(app)/(tabs)/_layout";
import { TABS_BAR_SPACING } from "@/styles/spacing";
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

    const edges: Edge[] = useMemo(() => {
      if (withHeader) {
        return ["left", "right", "bottom"];
      } else if (withTopSafeArea) {
        return ["top", "left", "right", "bottom"];
      }
      return ["left", "right"];
    }, [withHeader, withTopSafeArea]);

    return (
      <Box className="flex-1" style={{ backgroundColor: bgColor }}>
        <SafeAreaView
          className={cn("flex-1", className)}
          edges={edges}
          style={{
            backgroundColor: bgColor,
            paddingBottom: isTabScreen ? TAB_BAR_HEIGHT + TABS_BAR_SPACING : 0,
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
