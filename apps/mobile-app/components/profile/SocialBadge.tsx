import { LinearGradient } from "expo-linear-gradient";
import { cssInterop } from "nativewind";
import { type ReactElement } from "react";
import { View } from "react-native";

import { shadowStyles } from "@/styles/shadows";

cssInterop(LinearGradient, { className: "style" });

interface SocialBase {
  id: string;
  labelKey: string;
  url: string;
  icon: ReactElement;
}

// Chaque réseau a soit un fond uni (`background`), soit un dégradé de marque
// (`gradient`) — l'un XOR l'autre, garanti par le type (`never` interdit la
// propriété opposée dans chaque branche).
export type SocialItem = SocialBase &
  (
    | { gradient: readonly [string, string, ...string[]]; background?: never }
    | { background: string; gradient?: never }
  );

const BADGE_CLASSNAME =
  "h-[52px] w-[52px] items-center justify-center rounded-full";

export const SocialBadge = ({ item }: { item: SocialItem }): ReactElement => {
  if (item.gradient !== undefined) {
    return (
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        className={BADGE_CLASSNAME}
        style={shadowStyles.socialBadge}
      >
        {item.icon}
      </LinearGradient>
    );
  }

  return (
    <View
      className={BADGE_CLASSNAME}
      style={[shadowStyles.socialBadge, { backgroundColor: item.background }]}
    >
      {item.icon}
    </View>
  );
};
