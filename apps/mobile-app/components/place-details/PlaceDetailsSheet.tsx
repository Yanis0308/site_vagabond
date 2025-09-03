import {
  type BottomSheetHandleProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, {
  memo,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { TAB_BAR_HEIGHT } from "@/app/(app)/(tabs)/_layout";
import { Center } from "@/components/ui/center";
import { config } from "@/constants/Config";
import { useBottomSheetBack } from "@/hooks/other/useBottomSheetBack";
import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { useWikipediaLink } from "@/hooks/queries/useWikipediaLink";
import { shadowStyles } from "@/styles/shadows";
import { cn } from "@/utils/cn";
import { getOsmUrl } from "@/utils/openstreetmap";
import { type PoiType } from "@/utils/types";

import { CustomImage } from "../custom-ui/CustomImage";
import { CustomText } from "../custom-ui/CustomText";
import { ReviewsList } from "../place-details/ReviewsList";
import { Box } from "../ui/box";
import { Button, ButtonText } from "../ui/button";
import { themeColors } from "../ui/gluestack-ui-provider/config";
import { StarRating } from "../validate-place/StarRating";
import { DescriptionSection } from "./DescriptionSection";
import { FunFactsSection } from "./FunFactsSection";
import { Handle } from "./Handle";

interface PlaceDetailsSheetV2Props {
  place: PoiType | null;
  onPressLink: () => void;
  onClose?: () => void;
}

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

//TODO: utiliser le BottomSheet classique plutôt que la Modal pour éviter des Mount / Unmount ? La modal sert à en empiler plusieurs uniquement il me semble
export const PlaceDetailsSheet = memo(
  ({ place, onPressLink, onClose }: PlaceDetailsSheetV2Props): ReactElement => {
    const { t } = useTranslation("common");
    const DEFAULT_SNAP_POINT = 1;
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const user = useUsersMe();
    const animatedIndex = useSharedValue(0);
    const insets = useSafeAreaCustom();
    const [stickyHeaderIndices, setStickyHeaderIndices] = useState<number[]>(
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

    useBottomSheetBack(place !== null, bottomSheetModalRef, onClose);

    const isVisited = useMemo(() => {
      return (
        place?.visitedPois.find(
          (visitedPoi) => visitedPoi.userId === user.data?.id,
        ) !== undefined
      );
    }, [place, user]);

    useEffect(
      () => {
        if (place !== null) {
          bottomSheetModalRef.current?.present();
          bottomSheetModalRef.current?.snapToIndex(DEFAULT_SNAP_POINT);
        } else {
          bottomSheetModalRef.current?.close();
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- necessary
      [place?.id],
    );

    const snapPoints = useMemo(() => ["15%", "60%", "90%"], []);

    const backgroundStyle = useMemo(
      () => ({
        backgroundColor: themeColors.background["200"].hex,
        marginHorizontal: -2,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
      }),
      [],
    );

    const imageBoxAnimatedStyle = useAnimatedStyle(
      // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- mandatory for animation
      () => {
        const opacity = interpolate(
          animatedIndex.value,
          [0, 1],
          [0, 1],
          Extrapolation.CLAMP,
        );
        const translateY = interpolate(
          animatedIndex.value,
          [0, 1],
          [-50, 0],
          Extrapolation.CLAMP,
        );
        const marginTop = interpolate(
          animatedIndex.value,
          [0, 1],
          [0, 16],
          Extrapolation.CLAMP,
        );
        return {
          opacity,
          transform: [{ rotate: "2deg" }, { translateY }],
          marginTop,
        };
      },
    );

    const contentAnimatedStyle = useAnimatedStyle(
      // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- safe for testing
      () => {
        const translateY = interpolate(
          animatedIndex.value,
          [0, 1],
          [-260, 0], // Remonte pour combler l'espace de l'image
          Extrapolation.CLAMP,
        );
        return {
          transform: [{ translateY }],
        };
      },
    );

    const rating = useMemo(() => {
      return Math.round(
        place !== null
          ? place.visitedPois.reduce((acc, visitedPoi) => {
              return acc + visitedPoi.rating;
            }, 0) / place.visitedPois.length
          : 0,
      );
    }, [place]);

    const handleComponent = useCallback(
      ({ animatedIndex, animatedPosition }: BottomSheetHandleProps) => (
        <Handle
          animatedIndex={animatedIndex}
          animatedPosition={animatedPosition}
          rating={rating}
        />
      ),
      [rating],
    );

    // Reel time update of stickyHeaderIndices
    useAnimatedReaction(
      // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- useAnimatedReaction ne peut pas utiliser useCallback
      () => {
        const currentIndex = Math.round(animatedIndex.value);
        const lastIndex = 2; // Index du dernier snap point (90%)
        return currentIndex === lastIndex;
      },
      // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- useAnimatedReaction ne peut pas utiliser useCallback
      (isAtLastIndex) => {
        const newStickyIndices = isAtLastIndex ? [1] : [];
        runOnJS(setStickyHeaderIndices)(newStickyIndices);
      },
    );

    // Prepare image sources in priority order: wikidata -> first visited poi -> placeholder
    const imageSources = useMemo(() => {
      const sources: (string | number)[] = [];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe
      if (place?.data[0]?.rawInfo?.wikidata !== undefined) {
        sources.push(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe
          `https://hub.toolforge.org/${place.data[0]?.rawInfo?.wikidata}?p=image`,
        );
      }

      const lastVisitedPoiImageKey =
        place?.visitedPois[place.visitedPois.length - 1]?.imageKey;

      if (lastVisitedPoiImageKey !== undefined) {
        sources.push(`${config.cdnUrl}/${lastVisitedPoiImageKey}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- safe
      sources.push(require("@/assets/images/content/no-photo-placeholder.png"));

      return sources;
    }, [place?.data, place?.visitedPois]);

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

        // // Ajouter les coordonnées GPS si disponibles
        // if (
        //   place.coords?.latitude !== undefined &&
        //   place.coords?.longitude !== undefined
        // ) {
        //   googleQuery += ` ${place.coords.latitude},${place.coords.longitude}`;
        // }
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

    // Social icons
    const googleIcon = useMemo(
      () => (
        <CustomImage
          //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- it's ok for loading assets
          source={require("@/assets/images/google-logo.png")}
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
          //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- it's ok for loading assets
          source={require("@/assets/images/wikipedia-logo.png")}
          alt="Wikipedia Logo"
          height={28}
          width={28}
          contentFit="contain"
          showLoader={false}
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={DEFAULT_SNAP_POINT}
        snapPoints={snapPoints}
        animatedIndex={animatedIndex}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        backgroundStyle={backgroundStyle}
        handleComponent={handleComponent}
        bottomInset={TAB_BAR_HEIGHT}
      >
        {place !== null ? (
          <BottomSheetScrollView
            stickyHeaderIndices={stickyHeaderIndices}
            key={place.id}
          >
            <Center className={"z-20 gap-5 px-6"}>
              <Animated.View
                style={[imageBoxAnimatedStyle, shadowStyles.ratingBlock]}
                className={cn("w-full rounded-2xl bg-background-50 p-2")}
              >
                <CustomImage
                  //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- it's ok for loading assets
                  source={require("@/assets/images/emojis/animated/star-struck.webp")}
                  useAppleWebpCodec={false}
                  height={60}
                  width={60}
                  containerClassName="absolute -left-5 -top-3 z-10 rotate-[-16deg]"
                  contentFit={"contain"}
                  showLoader={false}
                />
                <CustomImage
                  sources={imageSources}
                  alt="Place photo illustration"
                  height={236}
                  className={"rounded-lg"}
                  contentFit={"autoWithBackground"}
                  priority={"high"}
                  showLoader={true}
                />
              </Animated.View>
            </Center>

            <Animated.View
              style={[contentAnimatedStyle, shadowStyles.contentLarge]}
              className="bg-background-200 pb-2"
            >
              <CustomText
                type="placeTitle"
                className={"px-6 pt-4 text-plum-700"}
              >
                {isVisited ? " ✅ " : ""}
                {t("place_details_sheet.title", {
                  name: place.data[0]?.name,
                })}
              </CustomText>

              {isVisited ? null : (
                <Button
                  onPress={onPressLink}
                  action="submit"
                  className="mx-6 mt-4"
                >
                  <ButtonText>{"📸   Valider le lieu"}</ButtonText>
                </Button>
              )}
            </Animated.View>

            <Box>
              <StarRating
                rating={rating}
                size={18}
                className={cn("mb-4 self-center mt-8")}
                ratingCount={place.visitedPois.length}
              />

              <ReviewsList poi={place} />

              {/* Boutons sociaux */}
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

              <FunFactsSection className="px-6 pt-10" />

              <DescriptionSection
                className="px-6 pt-10"
                text={place.data[0]?.description}
              />

              {place.data[0] !== undefined && user.data?.role === "ADMIN" ? (
                <Box className="mx-3 mt-6 flex gap-2 border border-dashed border-primary-500 px-3">
                  <CustomText
                    type="title"
                    className="text-center text-primary-700"
                  >
                    {"- Admin section -"}
                  </CustomText>

                  <Box className="flex-row flex-wrap gap-2">
                    <Button
                      size="small"
                      action="secondary"
                      href={getOsmUrl(place.id)}
                      isDisabled={getOsmUrl(place.id) === null}
                    >
                      <ButtonText>{"OSM"}</ButtonText>
                    </Button>
                    <Button
                      size="small"
                      action="secondary"
                      href={`https://www.google.com/maps/search/?api=1&query=${place.data[0].name}`}
                    >
                      <ButtonText>{"Maps"}</ButtonText>
                    </Button>
                    <Button
                      size="small"
                      action="secondary"
                      //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
                      href={`https://www.wikidata.org/wiki/${place.data[0].rawInfo?.wikidata}`}
                      //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
                      isDisabled={place.data[0].rawInfo?.wikidata === undefined}
                    >
                      <ButtonText>{"Wikidata"}</ButtonText>
                    </Button>
                  </Box>

                  <CustomText
                    type="title"
                    className="text-center text-primary-700"
                  >
                    {"- OSM tags -"}
                  </CustomText>
                  <Box className="flex">
                    <CustomText>
                      {`ID: ${place.id}\n`}
                      {`Filter level: ${place.data[0].filterLevel}`}
                    </CustomText>
                    {
                      //eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- safe for testing
                      Object.entries(place.data[0].rawInfo).map(
                        ([key, value]) => (
                          <CustomText key={key}>
                            {/* @ts-expect-error safe for testing */}
                            {key}: {value}
                          </CustomText>
                        ),
                      )
                    }
                  </Box>
                </Box>
              ) : null}
            </Box>

            <Box style={{ height: insets.bottom + 50 }} />
          </BottomSheetScrollView>
        ) : null}
      </BottomSheetModal>
    );
  },
);

PlaceDetailsSheet.displayName = "PlaceDetailsSheet";
