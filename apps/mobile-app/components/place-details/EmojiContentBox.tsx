import { type ReactNode, useState } from "react";
import { Pressable } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { cn } from "@/utils/cn";

export interface EmojiContentBoxProps {
  emoji: string;
  content: string;
  emojiPosition?: "top" | "center";
  contentClassName?: string;
  containerClassName?: string;
  showExpandable?: boolean;
  maxLines?: number;
  expandText?: string;
  collapseText?: string;
  truncateThreshold?: number;
}

const expandText = "...Lire plus";
const collapseText = "...Lire moins";

export const EmojiContentBox = ({
  emoji,
  content,
  contentClassName,
  containerClassName,
  showExpandable = false,
  maxLines = 3,
  truncateThreshold = 150,
}: EmojiContentBoxProps): ReactNode => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine if we need to show expandable behavior
  const needsTruncation = showExpandable && content.length > truncateThreshold;
  const shouldShowReadMore = needsTruncation && !isExpanded;

  return (
    <Box className={cn(containerClassName)}>
      <CustomText
        type="ratingText"
        className={cn("absolute -left-3 -top-4 z-[1] text-[32px]")}
      >
        {emoji}
      </CustomText>
      <Box
        className={cn(
          "flex-1 rounded-2xl border border-background-300 bg-background-50 p-3",
          contentClassName,
        )}
      >
        <CustomText
          type="ratingText"
          className="text-black-700"
          numberOfLines={shouldShowReadMore ? maxLines : undefined}
        >
          {content}
        </CustomText>
        {needsTruncation && (
          <Pressable
            onPress={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            <CustomText type="ratingText" className="text-sm text-primary-500">
              {isExpanded ? collapseText : expandText}
            </CustomText>
          </Pressable>
        )}
      </Box>
    </Box>
  );
};
