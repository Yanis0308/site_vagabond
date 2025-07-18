import { Stack } from "expo-router";
import { type ReactElement } from "react";

import { defaultScreenOptions } from "@/constants/ScreenOptions";

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- screen file so it's ok
export default function RootLayout(): ReactElement | null {
  return (
    <Stack screenOptions={defaultScreenOptions}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="validate-place/take-photo" />
      <Stack.Screen
        name="validate-place/review-form"
        options={{
          animation: "fade",
        }}
      />
    </Stack>
  );
}
