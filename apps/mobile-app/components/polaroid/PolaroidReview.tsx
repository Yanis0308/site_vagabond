import { memo } from "react";
import { useTranslation } from "react-i18next";

import { getPlainTextDate } from "@/utils/date";

import { CustomText } from "../custom-ui/CustomText";
import { Box } from "../ui/box";
import { Text } from "../ui/text";
import { StarRating } from "../validate-place/StarRating";
import { PolaroidBase } from "./PolaroidBase";

interface PolaroidReviewProps {
  imageUrl: string;
  username: string;
  rating: number;
  dateString: string;
  comment: string;
  className?: string;
}

export const PolaroidReview = memo(
  ({ imageUrl, username, rating, comment, className }: PolaroidReviewProps) => {
    const { i18n } = useTranslation();

    return (
      <PolaroidBase
        imageUrl={imageUrl}
        className={className}
        imageWithBorder={false}
        maintainAspectRatio={false}
        isSmall={true}
      >
        <Box className="p-2">
          {/* Grille à 2 colonnes */}
          <Box className="flex-row justify-between gap-4">
            {/* Colonne 1: Username et Rating */}
            <Box className="flex-1 gap-1">
              <CustomText type="username" className="text-black-700">
                {username}
              </CustomText>
              <StarRating rating={rating} size={12} withoutBackground />
            </Box>

            {/* Colonne 2: Date */}
            <Text className="self-center text-sm text-black-300">
              {getPlainTextDate({ locale: i18n.language, date: new Date() })}
            </Text>
          </Box>

          {/* Commentaire en dessous */}
          <Text className="h-[100px] pt-2 text-sm text-black-300">
            {comment.trim() !== "" ? comment : "Aucun commentaire"}
          </Text>
        </Box>
      </PolaroidBase>
    );
  },
);

PolaroidReview.displayName = "PolaroidReview";
