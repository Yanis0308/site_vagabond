import type { PoiEnrichedData } from "@vagabond/shared-utils";
import { memo, type ReactNode } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { cn } from "@/utils/cn";

interface CategoriesSectionProps {
  categories?: PoiEnrichedData["categories"];
  className?: string;
}

export const CategoriesSection = memo(
  ({ categories, className }: CategoriesSectionProps): ReactNode => {
    if (categories === undefined || categories.length === 0) {
      return null;
    }

    return (
      <Box className={cn("gap-2", className)}>
        <Box className="flex-row flex-wrap gap-2">
          {categories.map((category, index) => (
            <Box
              key={index}
              className="rounded-full border border-primary-500 bg-primary-100 px-3 py-1"
            >
              <CustomText
                type="ratingText"
                className="text-sm text-primary-700"
              >
                {category}
              </CustomText>
            </Box>
          ))}
        </Box>
      </Box>
    );
  },
);

CategoriesSection.displayName = "CategoriesSection";
