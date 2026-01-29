import { memo, type ReactNode } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { cn } from "@/utils/cn";

import { EmojiContentBox } from "./EmojiContentBox";

interface DescriptionSectionProps {
  text: string | undefined;
  className?: string;
}

export const DescriptionSection = memo(
  ({ text, className }: DescriptionSectionProps): ReactNode => {
    const displayText =
      (text?.length ?? 0) === 0
        ? "Aucune description n'est disponible pour ce lieu, nous travaillons actuellement pour en ajouter ✍🏻"
        : (text ?? "");

    return (
      <Box className={cn("gap-4", className)}>
        <CustomText type="title" className="text-center text-primary-700">
          {"Description"}
        </CustomText>
        <EmojiContentBox
          emoji="📖"
          content={displayText}
          showExpandable={true}
          contentClassName="gap-2 p-4"
        />
      </Box>
    );
  },
);

DescriptionSection.displayName = "DescriptionSection";
