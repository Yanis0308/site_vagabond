import { Stack } from "expo-router";
import { type ReactElement } from "react";

import { defaultScreenOptions } from "@/constants/ScreenOptions";

export default function RootLayout(): ReactElement | null {
  return (
    <Stack screenOptions={defaultScreenOptions}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="validate-place/review-form"
        options={{
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          animation: "fade",
        }}
      />
    </Stack>
  );
}
