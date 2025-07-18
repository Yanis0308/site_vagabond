import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useNavigation } from "expo-router";
import { memo, type ReactNode, useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "@/app/(app)/(tabs)/_layout";
import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";
import { cn } from "@/utils/cn";

import { Box } from "../ui/box";

interface CustomScreenContainerProps {
  children: ReactNode;
  isLightScreen: boolean;
  bgColor: string;
  withHeader: boolean;
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
    isTabScreen,
  }: CustomScreenContainerProps): ReactNode => {
    const navigation = useNavigation();
    const insets = useSafeAreaCustom();

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

    return (
      <Box className="flex-1" style={{ backgroundColor: bgColor }}>
        <SafeAreaView
          className={cn("flex-1", className)}
          edges={
            withHeader
              ? ["left", "right", "bottom"]
              : [
                  // "top",
                  "left",
                  "right",
                ]
          }
          style={{
            backgroundColor: bgColor,
            paddingBottom: isTabScreen ? TAB_BAR_HEIGHT + insets.bottom : 0,
          }}
        >
          <BottomSheetModalProvider>
            {/* <StatusBar hidden={true} /> */}
            <View className={"flex-1"} style={{ backgroundColor: bgColor }}>
              {children}
            </View>
          </BottomSheetModalProvider>
        </SafeAreaView>
      </Box>
    );
  },
);

CustomScreenContainer.displayName = "CustomScreenContainer";
