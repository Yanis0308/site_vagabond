import { Globe } from "lucide-react-native";
import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { SocialBadge, type SocialItem } from "@/components/profile/SocialBadge";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { logger } from "@/utils/logger";

const ICON_SIZE = 24;
const ICON_COLOR = "#FFFFFF";

// Brand gradient Instagram (45deg) — rendu via expo-linear-gradient car RN ne
// supporte pas les gradients CSS dans `style`.
const INSTAGRAM_GRADIENT = [
  "#f09433",
  "#e6683c",
  "#dc2743",
  "#cc2366",
  "#bc1888",
] as const;

// Source de vérité des comptes. URLs à garder synchronisées avec celles du site
// web (apps/website/lib/json-ld.tsx) ; handles à confirmer avec le marketing.
const SOCIALS: SocialItem[] = [
  {
    id: "instagram",
    labelKey: "socials.instagram",
    url: "https://www.instagram.com/vagabond_france/",
    icon: <InstagramIcon size={ICON_SIZE} color={ICON_COLOR} />,
    gradient: INSTAGRAM_GRADIENT,
  },
  {
    id: "tiktok",
    labelKey: "socials.tiktok",
    url: "https://www.tiktok.com/@vagabond_france",
    icon: <TikTokIcon size={ICON_SIZE} color={ICON_COLOR} />,
    background: "#111111",
  },
  {
    id: "linkedin",
    labelKey: "socials.linkedin",
    url: "https://www.linkedin.com/company/vagabond-app/",
    icon: <LinkedInIcon size={ICON_SIZE} color={ICON_COLOR} />,
    background: "#0A66C2",
  },
  {
    id: "web",
    labelKey: "socials.website",
    url: "https://www.vagabond.gg",
    icon: <Globe size={ICON_SIZE} color={ICON_COLOR} />,
    background: themeColors.primary["500"].hex,
  },
];

// Les URLs sont des liens web standard (`https`) : `Linking.openURL` peut être
// appelé directement, sans passer par `canOpenURL`.
const openUrl = (url: string): void => {
  Linking.openURL(url).catch((error: unknown) => {
    logger("Échec de l'ouverture du lien social", url, error);
  });
};

export const ProfileSocialsRow = (): ReactElement => {
  const { t } = useTranslation("common");

  return (
    <VStack className="items-center gap-3 py-5">
      <CustomText className="text-lg font-extrabold text-plum-700">
        {t("socials.title")}
      </CustomText>
      <CustomText className="text-center text-sm text-gray-600">
        {t("socials.description")}
      </CustomText>
      <HStack className="mt-1 gap-3.5">
        {SOCIALS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              openUrl(item.url);
            }}
            className="
              items-center gap-1.5
              active:opacity-80
            "
            accessibilityRole="link"
            accessibilityLabel={t(item.labelKey)}
          >
            <SocialBadge item={item} />
            <CustomText className="text-xs font-semibold text-gray-500">
              {t(item.labelKey)}
            </CustomText>
          </Pressable>
        ))}
      </HStack>
    </VStack>
  );
};
