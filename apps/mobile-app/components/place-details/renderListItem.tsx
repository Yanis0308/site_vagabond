import { type PoiEnrichedPhoto } from "@vagabond/shared-utils/dist/schemas/processors/llm";
import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";
import Animated from "react-native-reanimated";

import { Center } from "@/components/ui/center";
import { config } from "@/constants/Config";
import { type PoiEnrichedType } from "@/http/pois";
import { type VisitedPoiType } from "@/http/visited-pois";
import { shadowStyles } from "@/styles/shadows";
import { cn } from "@/utils/cn";
import { localImages } from "@/utils/localImages";

import { CustomImage } from "../custom-ui/CustomImage";
import { CustomText } from "../custom-ui/CustomText";
import { Button, ButtonText } from "../ui/button";
import { StarRating } from "../validate-place/StarRating";
import { AccessibilitySection } from "./AccessibilitySection";
import { AdminInfoSection } from "./AdminInfoSection";
import { AmenitiesSection } from "./AmenitiesSection";
import { AverageVisitDurationSection } from "./AverageVisitDurationSection";
import { BadgesSection } from "./BadgesSection";
import { type ListItemType } from "./buildListData";
import { CategoriesSection } from "./CategoriesSection";
import { ContactInfoSection } from "./ContactInfoSection";
import { DescriptionSection } from "./DescriptionSection";
import { FunFactsSection } from "./FunFactsSection";
import { PhotosLoadingPlaceholder } from "./PhotosLoadingPlaceholder";
import { PhotosSection } from "./PhotosSection";
import { PracticalTipsSection } from "./PracticalTipsSection";
import { ReviewsList } from "./ReviewsList";
import { SeasonalClosureSection } from "./SeasonalClosureSection";
import { SocialMediaSection } from "./SocialMediaSection";
import { TransportAccessSection } from "./TransportAccessSection";

interface RenderListItemParams {
  item: ListItemType;
  enrichedData: PoiEnrichedType | undefined;
  onPressLink: () => void;
  imageBoxAnimatedStyle: {
    opacity: number;
    transform: { translateY: number }[];
    marginTop: number;
  };
  contentAnimatedStyle: {
    transform: { translateY: number }[];
  };
  visitedPois: VisitedPoiType[];
  isLoadingEnriched: boolean;
}

export const useRenderListItem = ({
  enrichedData,
  onPressLink,
  imageBoxAnimatedStyle,
  contentAnimatedStyle,
  visitedPois,
  isLoadingEnriched,
}: Omit<RenderListItemParams, "item">): ((props: {
  item: ListItemType;
}) => ReactElement | null) => {
  const { t } = useTranslation("common");

  function RenderListItem({
    item,
  }: {
    item: ListItemType;
  }): ReactElement | null {
    switch (item.type) {
      case "reviews":
        return <ReviewsList visitedPois={visitedPois} />;
      case "header":
        const photos: PoiEnrichedPhoto[] = [];
        const hasEnrichedPhotos =
          enrichedData?.photos !== undefined && enrichedData.photos.length > 0;

        if (hasEnrichedPhotos && enrichedData.photos !== undefined) {
          photos.push(...enrichedData.photos);
        }
        if (photos.length === 0 && visitedPois.length > 0) {
          visitedPois.forEach((visitedPoi, index) => {
            const photo: PoiEnrichedPhoto = {
              url: `${config.cdnUrl}/${visitedPoi.imageKey}`,
              caption: visitedPoi.comment ?? "",
              credit: "",
              isPrimary: index === 0,
            };
            photos.push(photo);
          });
        }

        // Show loading placeholder if enriched data is loading and we don't have enriched photos yet
        const showLoadingPlaceholder =
          isLoadingEnriched && !hasEnrichedPhotos && visitedPois.length === 0;

        return (
          <Center className={"z-20 px-2"}>
            <Animated.View style={[imageBoxAnimatedStyle]} className="w-full">
              {!showLoadingPlaceholder && (
                <CustomImage
                  sources={localImages.starStruck}
                  useAppleWebpCodec={false}
                  height={60}
                  width={60}
                  containerClassName="absolute -left-1 -top-3 z-10 rotate-[-16deg]"
                  contentFit={"contain"}
                  showLoader={false}
                />
              )}
              {showLoadingPlaceholder ? (
                <PhotosLoadingPlaceholder />
              ) : (
                <PhotosSection photos={photos} />
              )}
            </Animated.View>
          </Center>
        );

      case "titleAndButton":
        return (
          <Animated.View
            style={[contentAnimatedStyle, shadowStyles.contentLarge]}
            className="bg-background-200 pb-2"
          >
            <CustomText type="placeTitle" className={"px-4 pt-4 text-plum-700"}>
              {item.isVisited ? " ✅ " : ""}
              {t("place_details_sheet.title", {
                name: enrichedData?.name ?? item.data.name,
              })}
            </CustomText>

            {item.isVisited ? null : (
              <Button
                onPress={onPressLink}
                action="submit"
                className="mx-6 mt-4"
              >
                <ButtonText>{"📸   Valider le lieu"}</ButtonText>
              </Button>
            )}
          </Animated.View>
        );

      case "rating":
        return (
          <StarRating
            rating={item.rating}
            size={18}
            className={cn("mb-2 self-center mt-4")}
            ratingCount={item.count}
          />
        );

      case "description":
        return <DescriptionSection className="px-4 pt-3" text={item.text} />;

      case "categories":
        return (
          <CategoriesSection
            categories={enrichedData?.categories}
            className="px-4 pt-3"
          />
        );

      case "contactInfo":
        return (
          <ContactInfoSection
            address={enrichedData?.address}
            phone={enrichedData?.phone}
            website={enrichedData?.website}
            openingHours={enrichedData?.openingHours}
            price={enrichedData?.price}
            className="px-4 pt-3"
          />
        );

      case "averageVisitDuration":
        return (
          <AverageVisitDurationSection
            averageVisitDuration={enrichedData?.averageVisitDuration}
            className="px-4 pt-3"
          />
        );

      case "badges":
        return (
          <BadgesSection
            instagrammable={enrichedData?.instagrammable}
            familyFriendly={enrichedData?.familyFriendly}
            locationType={enrichedData?.locationType}
            touristInterest={enrichedData?.touristInterest}
            reservationRequired={enrichedData?.reservationRequired}
            className="pt-3"
          />
        );

      case "accessibility":
        return (
          <AccessibilitySection
            accessibility={enrichedData?.accessibility}
            className="px-4 pt-3"
          />
        );

      case "transportAccess":
        return (
          <TransportAccessSection
            transportAccess={enrichedData?.transportAccess}
            className="px-4 pt-3"
          />
        );

      case "amenities":
        return (
          <AmenitiesSection
            amenities={enrichedData?.amenities}
            className="px-4 pt-3"
          />
        );

      case "practicalTips":
        return (
          <PracticalTipsSection
            practicalTips={enrichedData?.practicalTips}
            className="px-4 pt-3"
          />
        );

      case "funFacts":
        return enrichedData?.funFacts !== undefined ? (
          <FunFactsSection
            funFacts={enrichedData.funFacts}
            className="px-4 pt-3"
          />
        ) : null;

      case "seasonalClosure":
        return (
          <SeasonalClosureSection
            seasonalClosure={enrichedData?.seasonalClosure}
            className="px-4 pt-3"
          />
        );

      case "socialMedia":
        return (
          <SocialMediaSection
            socialMedia={enrichedData?.socialMedia}
            className="px-4 pt-3"
          />
        );

      case "admin":
        return (
          <AdminInfoSection placeId={item.placeId} placeName={item.placeName} />
        );

      case "loading":
        return (
          <Center className="py-8">
            <ActivityIndicator size="large" color="#8B5CF6" />
            <CustomText className="mt-4 font-medium text-typography-500">
              {t("place_details_sheet.loading_enriched_data")}
            </CustomText>
          </Center>
        );

      default:
        return null;
    }
  }

  return RenderListItem;
};
