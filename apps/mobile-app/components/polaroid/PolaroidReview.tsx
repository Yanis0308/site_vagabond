import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { type ImageLoadAsyncSource } from "@/hooks/queries/useImageFromMultipleSources";
import { getPlainTextDate } from "@/utils/date";

import { CustomText } from "../custom-ui/CustomText";
import { Box } from "../ui/box";
import { Text } from "../ui/text";
import { StarRating } from "../validate-place/StarRating";
import { PolaroidBase } from "./PolaroidBase";

interface PolaroidReviewProps {
  imageUrl: ImageLoadAsyncSource;
  username: string;
  rating: number | undefined;
  dateString: string;
  comment: string;
  className?: string;
}

export const PolaroidReview = memo(
  ({
    imageUrl,
    username,
    rating,
    dateString,
    comment,
    className,
  }: PolaroidReviewProps) => {
    const { i18n } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const commentText = comment.trim() !== "" ? comment : "Aucun commentaire";
    const needsTruncation = commentText.length > 100;
    const shouldShowReadMore = needsTruncation && !isExpanded;

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
              {rating !== undefined && (
                <StarRating rating={rating} size={12} withoutBackground />
              )}
            </Box>

            {/* Colonne 2: Date */}
            <Text className="self-center text-sm text-black-300">
              {getPlainTextDate({
                locale: i18n.language,
                date: new Date(dateString),
              })}
            </Text>
          </Box>

          {/* Commentaire en dessous */}
          <Box className="pt-2">
            <Text
              className="text-sm text-black-300"
              numberOfLines={shouldShowReadMore ? 3 : undefined}
            >
              {commentText}
            </Text>
            {needsTruncation && (
              <Pressable
                onPress={() => {
                  setIsExpanded(!isExpanded);
                }}
              >
                <Text className="mt-1 text-xs text-primary-500">
                  {isExpanded ? "...Lire moins" : "...Lire plus"}
                </Text>
              </Pressable>
            )}
          </Box>
        </Box>
      </PolaroidBase>
    );
  },
);

PolaroidReview.displayName = "PolaroidReview";
