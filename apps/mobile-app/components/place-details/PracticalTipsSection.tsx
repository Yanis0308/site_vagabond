import type { PoiEnrichedData } from "@vagabond/shared-utils";
import { memo, type ReactNode } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";

import { CollapsibleSection } from "./CollapsibleSection";

interface PracticalTipsSectionProps {
  practicalTips?: PoiEnrichedData["practicalTips"];
  className?: string;
}

export const PracticalTipsSection = memo(
  ({ practicalTips, className }: PracticalTipsSectionProps): ReactNode => {
    if (practicalTips === undefined || practicalTips.length === 0) {
      return null;
    }

    return (
      <CollapsibleSection
        title="Conseils pratiques"
        emoji="💡"
        className={className}
      >
        {practicalTips.map((tip, index) => (
          <CustomText key={index} className="text-sm text-black-700">
            {tip}
          </CustomText>
        ))}
      </CollapsibleSection>
    );
  },
);

PracticalTipsSection.displayName = "PracticalTipsSection";
