import { getAuth } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { FlashList } from "@shopify/flash-list";
import { type ReactElement, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { config } from "@/constants/Config";
import { useValidatedPlaces } from "@/hooks/queries/useValidatedPlaces";
import { logger } from "@/utils/logger";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
export default function HomeScreen(): ReactElement {
  const { t } = useTranslation("common");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { data: validatedPlaces } = useValidatedPlaces();

  // Trier les lieux validés du plus récent au plus ancien
  const sortedValidatedPlaces = useMemo(() => {
    if (validatedPlaces === undefined) return [];
    return [...validatedPlaces].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [validatedPlaces]);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      try {
        // Prevent sign-in with same Google account without asking
        await GoogleSignin.revokeAccess();
      } catch (error) {
        logger("Error GoogleSignin revoking access", error);
      }
      await getAuth().signOut();
    } catch (error) {
      logger("Error signing out", error);
      setIsSigningOut(false);
    }
  }, []);

  const onPress = useCallback(() => void signOut(), [signOut]);

  const renderPlaceItem = useCallback(
    ({ item: place }: { item: (typeof sortedValidatedPlaces)[0] }) => (
      <Box className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <HStack className="gap-4">
          {/* Image */}
          <CustomImage
            sources={`${config.cdnUrl}/${place.imageKey}`}
            height={80}
            width={80}
            className="rounded-lg"
            contentFit="cover"
            showLoader={true}
          />

          {/* Informations */}
          <VStack className="flex-1 gap-1">
            <HStack className="items-center gap-2">
              <CustomText className="font-semibold">
                {place.username}
              </CustomText>
              <CustomText className="text-yellow-500">
                {"⭐".repeat(place.rating)}
              </CustomText>
            </HStack>

            <CustomText className="text-sm text-gray-600">
              {new Date(place.createdAt).toLocaleDateString("fr-FR")}
            </CustomText>

            {place.comment.length > 0 && (
              <CustomText className="mt-1 text-gray-800">
                {place.comment}
              </CustomText>
            )}
          </VStack>
        </HStack>
      </Box>
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: (typeof sortedValidatedPlaces)[0]) => item.id.toString(),
    [],
  );

  const listEmptyComponent = useMemo(
    () => (
      <Box className="flex-1 items-center justify-center py-8">
        <CustomText className="text-gray-500">
          {t("no_validated_places")}
        </CustomText>
      </Box>
    ),
    [t],
  );

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background["200"].hex}
      withHeader={false}
      isTabScreen={true}
    >
      <Box className="flex size-full">
        <VStack className="flex size-full gap-4 p-4">
          {/* Header avec bouton de déconnexion */}
          <Box className="items-center gap-4 py-4">
            <CustomText>
              {isSigningOut ? "Loading..." : "Can sign out"}
            </CustomText>
            <Button
              onPress={onPress}
              isDisabled={isSigningOut}
              action="secondary"
            >
              <ButtonText>{t("sign_out")}</ButtonText>
            </Button>
          </Box>

          {/* Liste des validated places */}
          <VStack className="flex-1">
            <CustomText className="mb-4 text-lg font-semibold">
              {t("validated_places")}
            </CustomText>

            <FlashList
              data={sortedValidatedPlaces}
              renderItem={renderPlaceItem}
              keyExtractor={keyExtractor}
              ListEmptyComponent={listEmptyComponent}
            />
          </VStack>
        </VStack>
      </Box>
    </CustomScreenContainer>
  );
}
