import type { PoiEnrichedData, VisitedPoi } from "@vagabond/shared-utils";
import { type ReactElement } from "react";

import { cn } from "@/utils/cn";

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
import { HeaderSection } from "./HeaderSection";
import { LoadingSection } from "./LoadingSection";
import { PracticalTipsSection } from "./PracticalTipsSection";
import { ReviewsList } from "./ReviewsList";
import { SeasonalClosureSection } from "./SeasonalClosureSection";
import { SocialMediaSection } from "./SocialMediaSection";
import { TitleAndButtonSection } from "./TitleAndButtonSection";
import { TransportAccessSection } from "./TransportAccessSection";

interface RenderListItemProps {
  item: ListItemType;
  enrichedData: PoiEnrichedData | undefined;
  onPressCamera: () => Promise<void>;
  onPressGallery: () => Promise<void>;
  imageBoxAnimatedStyle: {
    opacity: number;
    transform: Array<{ translateY: number }>;
    marginTop: number;
  };
  contentAnimatedStyle: {
    transform: Array<{ translateY: number }>;
  };
  visitedPois: VisitedPoi[];
  isLoadingEnriched: boolean;
}

export function RenderListItem({
  item,
  enrichedData,
  onPressCamera,
  onPressGallery,
  imageBoxAnimatedStyle,
  contentAnimatedStyle,
  visitedPois,
  isLoadingEnriched,
}: RenderListItemProps): ReactElement | null {
  switch (item.type) {
    case "reviews":
      return <ReviewsList visitedPois={visitedPois} />;
    case "header":
      return (
        <HeaderSection
          enrichedData={enrichedData}
          visitedPois={visitedPois}
          isLoadingEnriched={isLoadingEnriched}
          imageBoxAnimatedStyle={imageBoxAnimatedStyle}
        />
      );

    case "titleAndButton":
      return (
        <TitleAndButtonSection
          enrichedData={enrichedData}
          placeName={item.data.name}
          isVisited={item.isVisited}
          onPressCamera={onPressCamera}
          onPressGallery={onPressGallery}
          contentAnimatedStyle={contentAnimatedStyle}
        />
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
      return <LoadingSection />;

    default:
      return null;
  }
}
