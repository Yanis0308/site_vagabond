import { memo, type ReactNode } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { cn } from "@/utils/cn";

interface FunFactsSectionProps {
  funFacts?: { emoji: string; text: string }[];
  className?: string;
}

export const FunFactsSection = memo(
  ({
    funFacts = [
      {
        emoji: "😲",
        text: "Aucun fun fact n'est disponible pour ce lieu, nous travaillons actuellement pour en ajouter 😉",
      },
    ],
    className,
  }: FunFactsSectionProps): ReactNode => {
    return (
      <Box className={cn("gap-8 justify-center items-stretch", className)}>
        <CustomText type="title" className="text-center text-primary-700">
          {"Fun facts"}
        </CustomText>
        {funFacts.slice(0, 3).map(({ emoji, text }) => (
          <FunFact key={text} emoji={emoji} text={text} />
        ))}
      </Box>
    );
  },
);

FunFactsSection.displayName = "FunFactsSection";

interface FunFactProps {
  emoji: string;
  text: string;
}

const FunFact = memo(({ emoji, text }: FunFactProps): ReactNode => {
  return (
    <Box className="relative ml-6 flex flex-row gap-2">
      <CustomText
        type="ratingText"
        className="absolute -left-8 -top-8 z-[1] text-[40px]"
      >
        {emoji}
      </CustomText>
      <CustomText
        type="ratingText"
        className="flex-1 rounded-2xl border border-background-300 bg-background-50 p-4"
      >
        {text}
      </CustomText>
    </Box>
  );
});

FunFact.displayName = "FunFact";
