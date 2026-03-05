import { type Stack } from "expo-router";
import type { ComponentProps } from "react";

type StackScreenOptions = NonNullable<
  ComponentProps<typeof Stack>["screenOptions"]
>;

export const defaultScreenOptions: StackScreenOptions = {
  headerShown: false,
  headerBackButtonDisplayMode: "minimal" as const,
  headerTitle: "",
  headerShadowVisible: false,
  headerTintColor: "white",
  // https://github.com/software-mansion/react-native-screens/issues/1796#issuecomment-3341869215
  // We're forcing fade animation from bottom like recommended in the issue
  // because on a Android device sometimes that provokes transparency problem after changing screen
  animation: "fade_from_bottom",
  animationDuration: 200,
};
