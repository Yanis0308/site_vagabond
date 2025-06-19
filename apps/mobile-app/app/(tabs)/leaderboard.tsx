import React, { type ReactElement } from "react";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
export default function Leaderboard(): ReactElement {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <CustomText type="title">{"Leaderboard"}</CustomText>
    </View>
  );
}
