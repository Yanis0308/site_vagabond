import { Stack } from "expo-router";
import { type ReactElement } from "react";

import { defaultScreenOptions } from "@/constants/ScreenOptions";

export default function RootLayout(): ReactElement | null {
  // We have removed custom chosed fade animation for now
  // because on a Samsung Android device that provokes transparency problem after place review form
  return (
    <Stack screenOptions={defaultScreenOptions}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="validate-place/review-form" />
      <Stack.Screen name="search" />
      <Stack.Screen name="user/[userId]" />
    </Stack>
  );
}
