import { type ReactNode } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { cn } from "@/utils/cn";

import { EmojiContentBox } from "./EmojiContentBox";

interface FunFactsSectionProps {
  funFacts: string[];
  className?: string;
}

export const FunFactsSection = ({
  funFacts,
  className,
}: FunFactsSectionProps): ReactNode => {
  const emojisList = [
    "😲",
    "🤫",
    "🤔",
    "😏",
    "🫢",
    "🤓",
    "🤨",
    "🧐",
    "🥸",
    "🤯",
  ] as const;

  return (
    <Box className={cn("gap-4", className)}>
      <CustomText type="title" className="text-center text-primary-700">
        {"Fun facts"}
      </CustomText>
      <Box className="gap-3">
        {funFacts.map((item, index) => (
          <EmojiContentBox
            key={`${item}-${index}`}
            emoji={emojisList[index] ?? emojisList[0]}
            content={item}
          />
        ))}
      </Box>
    </Box>
  );
};
