import { Facebook, Instagram, Twitter } from "lucide-react-native";
import { memo, type ReactNode } from "react";
import { Linking, Pressable } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { type PoiEnrichedType } from "@/http/pois";
import { cn } from "@/utils/cn";

interface SocialMediaSectionProps {
  socialMedia?: PoiEnrichedType["socialMedia"];
  className?: string;
}

export const SocialMediaSection = memo(
  ({ socialMedia, className }: SocialMediaSectionProps): ReactNode => {
    if (socialMedia === undefined) {
      return null;
    }

    const hasSocialMedia =
      socialMedia.instagramHandle !== undefined ||
      socialMedia.facebookUrl !== undefined ||
      socialMedia.twitterHandle !== undefined;

    if (!hasSocialMedia) {
      return null;
    }

    const handlePress = (url: string): void => {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          }
          return Promise.resolve();
        })
        .catch(() => {
          // Handle error silently
        });
    };

    const socialItems: {
      IconComponent: typeof Instagram;
      label: string;
      url: string;
    }[] = [];

    if (socialMedia.instagramHandle !== undefined) {
      socialItems.push({
        IconComponent: Instagram,
        label: `Instagram ${socialMedia.instagramHandle}`,
        url: `https://www.instagram.com/${socialMedia.instagramHandle.replace("@", "")}`,
      });
    }
    if (socialMedia.facebookUrl !== undefined) {
      socialItems.push({
        IconComponent: Facebook,
        label: "Facebook",
        url: socialMedia.facebookUrl,
      });
    }
    if (socialMedia.twitterHandle !== undefined) {
      socialItems.push({
        IconComponent: Twitter,
        label: `Twitter ${socialMedia.twitterHandle}`,
        url: `https://twitter.com/${socialMedia.twitterHandle.replace("@", "")}`,
      });
    }

    return (
      <Box className={cn("bg-white rounded-lg mx-4 mt-6", className)}>
        <CustomText type="rating" className="px-6 py-2 text-primary-700">
          {"Réseaux sociaux"}
        </CustomText>
        {socialItems.map((item, index) => {
          const IconComponent = item.IconComponent;
          return (
            <Box key={index}>
              <Pressable
                onPress={() => handlePress(item.url)}
                className="px-6 active:opacity-70"
              >
                <Box className="flex-row items-center gap-3 py-2">
                  <Box className="w-6 items-center">
                    <IconComponent size={20} color="#000" />
                  </Box>
                  <CustomText type="ratingText" className="flex-1">
                    {item.label}
                  </CustomText>
                  <CustomText
                    type="ratingText"
                    className="text-lg text-primary-500"
                  >
                    {"→"}
                  </CustomText>
                </Box>
              </Pressable>
              {index < socialItems.length - 1 && <Divider className="my-1" />}
            </Box>
          );
        })}
        <Box className="pb-4" />
      </Box>
    );
  },
);

SocialMediaSection.displayName = "SocialMediaSection";
