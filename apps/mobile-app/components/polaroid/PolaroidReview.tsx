import { Trash2 } from "lucide-react-native";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { useDeleteVisitedPoiWithConfirm } from "@/hooks/mutations/useDeleteVisitedPoiWithConfirm";
import { type ImageLoadAsyncSource } from "@/hooks/queries/useImageFromMultipleSources";
import { getPlainTextDate } from "@/utils/date";

import { CustomText } from "../custom-ui/CustomText";
import { Box } from "../ui/box";
import { Text } from "../ui/text";
import { StarRating } from "../validate-place/StarRating";
import { PolaroidBase } from "./PolaroidBase";

interface PolaroidReviewProps {
  id: number;
  poiId: string;
  imageUrl: ImageLoadAsyncSource;
  username: string;
  rating: number | undefined;
  dateString: string;
  comment: string;
  className?: string;
  deletable: boolean;
}

export const PolaroidReview = memo(
  ({
    id,
    poiId,
    imageUrl,
    username,
    rating,
    dateString,
    comment,
    className,
    deletable,
  }: PolaroidReviewProps) => {
    const { i18n, t } = useTranslation("common");
    const handleDeleteVisitedPoi = useDeleteVisitedPoiWithConfirm(poiId);
    const [isExpanded, setIsExpanded] = useState(false);
    const commentText =
      comment.trim() !== "" ? comment : t("reviews_list.no_comment");
    const needsTruncation = commentText.length > 100;
    const shouldShowReadMore = needsTruncation && !isExpanded;

    const topRightAction = deletable ? (
      <Pressable
        onPress={() => {
          handleDeleteVisitedPoi(id);
        }}
        className="rounded-full bg-white p-1"
        hitSlop={8}
      >
        <Trash2 size={14} color={themeColors.warning["600"].hex} />
      </Pressable>
    ) : undefined;

    return (
      <PolaroidBase
        imageUrl={imageUrl}
        className={className}
        imageWithBorder={false}
        maintainAspectRatio={false}
        isSmall={true}
        topRightAction={topRightAction}
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

          <Box className="pt-2" style={{ minHeight: 80 }}>
            <Text
              className="text-sm leading-[14px] text-black-300"
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
                  {isExpanded
                    ? t("reviews_list.read_less")
                    : t("reviews_list.read_more")}
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
