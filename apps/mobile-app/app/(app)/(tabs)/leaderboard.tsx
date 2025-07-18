import React, { type ReactElement } from "react";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
export default function Leaderboard(): ReactElement {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <CustomText type="title" className="p-3 text-primary-500">
        {"Leaderboard is not available yet"}
      </CustomText>
    </View>
  );
}
