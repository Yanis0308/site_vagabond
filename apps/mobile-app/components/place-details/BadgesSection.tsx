import { memo, type ReactNode } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { type PoiEnrichedType } from "@/http/pois";
import { cn } from "@/utils/cn";

interface BadgesSectionProps {
  instagrammable?: PoiEnrichedType["instagrammable"];
  familyFriendly?: PoiEnrichedType["familyFriendly"];
  locationType?: PoiEnrichedType["locationType"];
  touristInterest?: PoiEnrichedType["touristInterest"];
  reservationRequired?: PoiEnrichedType["reservationRequired"];
  className?: string;
}

const LOCATION_TYPE_CONFIG: Record<string, { emoji: string; label: string }> = {
  interior: { emoji: "🏛️", label: "Intérieur" },
  exterior: { emoji: "🌳", label: "Extérieur" },
  both: { emoji: "🌍", label: "Mixte" },
};

const TOURIST_INTEREST_CONFIG: Record<
  string,
  { emoji: string; label: string }
> = {
  "must-see": { emoji: "⭐", label: "Incontournable" },
  high: { emoji: "⭐", label: "Intérêt élevé" },
  medium: { emoji: "⭐", label: "Intérêt moyen" },
  low: { emoji: "⭐", label: "Intérêt faible" },
  niche: { emoji: "⭐", label: "Niche" },
};

interface BadgeItemProps {
  emoji: string;
  label: string;
  show: boolean;
}

const BadgeItem = memo(({ emoji, label, show }: BadgeItemProps): ReactNode => {
  if (!show) {
    return null;
  }

  return (
    <Box className="w-[23%] items-center gap-1.5 px-1">
      <Box className="size-14 items-center justify-center rounded-full border-[2.5px] border-primary-500 bg-primary-100">
        <CustomText type="ratingText" className="text-[26px]">
          {emoji}
        </CustomText>
      </Box>
      <CustomText
        type="ratingText"
        className="text-center text-2xs font-medium leading-tight text-black-700"
        numberOfLines={2}
      >
        {label}
      </CustomText>
    </Box>
  );
});

BadgeItem.displayName = "BadgeItem";

export const BadgesSection = memo(
  ({
    instagrammable,
    familyFriendly,
    locationType,
    touristInterest,
    reservationRequired,
    className,
  }: BadgesSectionProps): ReactNode => {
    // prettier-ignore
    const locationTypeConfig =
      locationType !== undefined
        ? (LOCATION_TYPE_CONFIG[locationType] ?? {
          emoji: "📍",
          label: locationType,
        })
        : null;

    // prettier-ignore
    const touristInterestConfig =
      touristInterest !== undefined
        ? (TOURIST_INTEREST_CONFIG[touristInterest] ?? {
          emoji: "⭐",
          label: touristInterest,
        })
        : null;

    // prettier-ignore
    const reservationConfig =
      reservationRequired !== undefined
        ? {
          emoji: "📅",
          label: reservationRequired
            ? "Réservation requise"
            : "Sans réservation",
        }
        : null;

    const hasAnyBadge =
      instagrammable === true ||
      familyFriendly === true ||
      locationTypeConfig !== null ||
      touristInterestConfig !== null ||
      reservationConfig !== null;

    if (!hasAnyBadge) {
      return null;
    }

    return (
      <Box className={cn("px-3 py-3", className)}>
        <Box className="flex-row flex-wrap items-start justify-start gap-y-3">
          <BadgeItem
            emoji={touristInterestConfig?.emoji ?? ""}
            label={touristInterestConfig?.label ?? ""}
            show={touristInterestConfig !== null}
          />
          <BadgeItem
            emoji={locationTypeConfig?.emoji ?? ""}
            label={locationTypeConfig?.label ?? ""}
            show={locationTypeConfig !== null}
          />
          <BadgeItem
            emoji="👨‍👩‍👧‍👦"
            label="Adapté aux familles"
            show={familyFriendly === true}
          />
          <BadgeItem
            emoji="📸"
            label="Instagrammable"
            show={instagrammable === true}
          />
          <BadgeItem
            emoji={reservationConfig?.emoji ?? ""}
            label={reservationConfig?.label ?? ""}
            show={reservationConfig !== null}
          />
        </Box>
      </Box>
    );
  },
);

BadgesSection.displayName = "BadgesSection";
