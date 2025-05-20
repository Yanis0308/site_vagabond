import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { type ExternalPathString } from "expo-router";
import React, {
  memo,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { type ValidatedPlaceType } from "@/http/validate-place";
import { logger } from "@/utils/logger";
import { type PoiType } from "@/utils/types";

import { ButtonLink } from "./custom-ui/ButtonLink";
import { Box } from "./ui/box";
import { Divider } from "./ui/divider";

interface PlaceDetailsSheetV2Props {
  place: PoiType | null;
  validatedPlace: ValidatedPlaceType | null;
  onPressLink: () => void;
}

//TODO: utiliser le BottomSheet classique plutôt que la Modal pour éviter des Mount / Unmount ? La modal sert à en empiler plusieurs uniquement il me semble
export const PlaceDetailsSheet = memo(
  ({
    place,
    validatedPlace,
    onPressLink,
  }: PlaceDetailsSheetV2Props): ReactElement => {
    const { t } = useTranslation("common");
    const DEFAULT_SNAP_POINT = 1;
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    useEffect(() => {
      if (place !== null) {
        bottomSheetModalRef.current?.present();
        bottomSheetModalRef.current?.snapToIndex(DEFAULT_SNAP_POINT);
      } else {
        bottomSheetModalRef.current?.close();
      }
    }, [place]);

    const snapPoints = useMemo(() => ["15%", "80%"], []);

    const handleSheetChanges = useCallback((index: number) => {
      logger("handleSheetChanges", index);
    }, []);

    const navigationLink =
      Platform.select({
        ios: `maps://?q=${place?.data[0]?.name}&ll=${place?.coords.latitude},${place?.coords.longitude}`,
        android: `geo:${place?.coords.latitude},${place?.coords.longitude}?q=${place?.coords.latitude},${place?.coords.longitude}(${place?.data[0]?.name})`,
      }) ?? "";

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={DEFAULT_SNAP_POINT}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        style={{ marginHorizontal: 10 }}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
      >
        <BottomSheetScrollView>
          <VStack className="w-full gap-5 px-5 pb-10">
            <Center className={"gap-5"}>
              <Heading size={"2xl"} className={"text-center"}>
                {t("place_details_sheet.title", {
                  name: place?.data[0]?.name,
                })}
              </Heading>
              <CustomImage
                source={`https://picsum.photos/seed/${place?.id}/1000/1000`}
                alt="Place photo illustration"
                className={"h-52 w-full"}
                contentFit={"cover"}
              />
              {validatedPlace !== null ? null : (
                <Button onPress={onPressLink}>
                  <ButtonText>
                    {t("place_details_sheet.visit_place")}
                  </ButtonText>
                </Button>
              )}
            </Center>
            <Text size={"lg"}>{place?.data[0]?.description}</Text>
            {validatedPlace !== null ? (
              <VStack className={"items-center gap-1"}>
                <Heading size={"xl"}>
                  {t("place_details_sheet.your_photo")}
                </Heading>
                <CustomImage
                  source={validatedPlace.photo.formats.large.url}
                  alt="Place photo illustration"
                  className={"h-52 w-full"}
                  contentFit={"contain"}
                />
              </VStack>
            ) : null}

            {place?.data[0] !== undefined ? (
              <Box className="flex gap-8">
                <Box className="flex-row flex-wrap gap-2">
                  <ButtonLink
                    href={`https://www.google.com/search?q=${place.data[0].name}`}
                    className="rounded-full"
                  >
                    <ButtonText>
                      {t("place_details_sheet.search_on_google")}
                    </ButtonText>
                  </ButtonLink>
                  <ButtonLink
                    href={`https://www.google.com/maps/search/?api=1&query=${place.data[0].name}`}
                    className="rounded-full"
                  >
                    <ButtonText>
                      {t("place_details_sheet.search_on_google")}
                    </ButtonText>
                  </ButtonLink>
                  <ButtonLink
                    href={navigationLink as ExternalPathString}
                    className="rounded-full"
                  >
                    <ButtonText>
                      {t("place_details_sheet.navigate_to_place")}
                    </ButtonText>
                  </ButtonLink>
                  <ButtonLink
                    //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
                    href={`https://www.wikipedia.org/wiki/${place.data[0]?.rawInfo?.wikipedia}`}
                    className="rounded-full"
                    //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
                    isDisabled={place.data[0]?.rawInfo?.wikipedia === undefined}
                  >
                    <ButtonText>
                      {t("place_details_sheet.search_on_wikipedia")}
                    </ButtonText>
                  </ButtonLink>
                  <ButtonLink
                    //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
                    href={`https://www.wikidata.org/wiki/${place.data[0].rawInfo?.wikidata}`}
                    className="rounded-full"
                    //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
                    isDisabled={place.data[0]?.rawInfo?.wikidata === undefined}
                  >
                    <ButtonText>
                      {t("place_details_sheet.search_on_wikidata")}
                    </ButtonText>
                  </ButtonLink>
                </Box>
                <Divider />
                <Box className="flex">
                  {
                    //eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- safe for testing
                    Object.entries(place.data[0].rawInfo).map(
                      ([key, value]) => (
                        <Text key={key}>
                          {/* @ts-expect-error safe for testing */}
                          {key}: {value}
                        </Text>
                      ),
                    )
                  }
                </Box>
              </Box>
            ) : null}
          </VStack>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

PlaceDetailsSheet.displayName = "PlaceDetailsSheet";
