import { memo, type ReactElement, useCallback, useMemo } from "react";
import { Linking } from "react-native";

import { useWikipediaLink } from "@/hooks/queries/useWikipediaLink";
import { localImages } from "@/utils/localImages";
import { type PoiType } from "@/utils/types";

import { CustomImage } from "../custom-ui/CustomImage";
import { Box } from "../ui/box";
import { Button, ButtonText } from "../ui/button";

// Composant pour les boutons sociaux publics
interface SocialButtonProps {
  label: string;
  url?: string | null;
  icon?: ReactElement;
}

const SocialButton = memo(({ label, url, icon }: SocialButtonProps) => {
  const handlePress = useCallback(() => {
    if (url !== null && url !== undefined && url !== "") {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          }
          return Promise.resolve();
        })
        .catch(() => {
          // Handle error silently for better UX
        });
    }
  }, [url]);

  return (
    <Button
      size="medium"
      action="link"
      onPress={
        url !== null && url !== undefined && url !== ""
          ? handlePress
          : undefined
      }
      isDisabled={url === null || url === undefined || url === ""}
      className="flex-1"
    >
      {icon}
      <ButtonText>{label}</ButtonText>
    </Button>
  );
});

SocialButton.displayName = "SocialButton";

export const ExternalsButtonsSection = memo(({ place }: { place: PoiType }) => {
  // Social icons
  const googleIcon = useMemo(
    () => (
      <CustomImage
        sources={localImages.googleLogo}
        alt="Google Logo"
        height={24}
        width={24}
        contentFit="contain"
        showLoader={false}
      />
    ),
    [],
  );

  const wikipediaIcon = useMemo(
    () => (
      <CustomImage
        sources={localImages.wikipediaLogo}
        alt="Wikipedia Logo"
        height={28}
        width={28}
        contentFit="contain"
        showLoader={false}
      />
    ),
    [],
  );

  // Récupération du lien Wikipedia via Hub Toolforge
  const wikipediaParams = useMemo(
    () => ({
      //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
      wikidataId: place?.data[0]?.rawInfo?.wikidata as string | undefined,
      //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
      wikipediaId: place?.data[0]?.rawInfo?.wikipedia as string | undefined,
    }),
    [place],
  );

  const { data: wikipediaLink } = useWikipediaLink(wikipediaParams);

  // Prepare social links
  const socialLinks = useMemo(() => {
    if (place?.data[0] === null || place?.data[0] === undefined) {
      return { wikipediaUrl: null, googleSearchUrl: null };
    }

    const placeName = place.data[0].name;

    // Construire la recherche Google avec nom et position GPS
    let googleQuery = "";
    if (placeName !== undefined && placeName !== "") {
      googleQuery = placeName;
    }

    return {
      // Utiliser le lien Wikipedia dynamique du hook ou null
      wikipediaUrl: wikipediaLink ?? null,
      googleSearchUrl:
        googleQuery !== ""
          ? `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`
          : null,
    };
  }, [place?.data, wikipediaLink]);

  return (
    <Box className="mx-6 mb-2 mt-8">
      <Box className="flex-col gap-3">
        <SocialButton
          label="Voir sur Wikipédia"
          url={socialLinks.wikipediaUrl}
          icon={wikipediaIcon}
        />
        <SocialButton
          label="Rechercher sur Google"
          url={socialLinks.googleSearchUrl}
          icon={googleIcon}
        />
      </Box>
    </Box>
  );
});

ExternalsButtonsSection.displayName = "ExternalsButtonsSection";
