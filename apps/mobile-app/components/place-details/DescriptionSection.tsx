import { memo, type ReactNode } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { cn } from "@/utils/cn";

interface DescriptionSectionProps {
  text?: string;
  className?: string;
}

export const DescriptionSection = memo(
  ({
    text = "Vestibulum dolor lectus, accumsan ut convallis id, lobortis vitae justous felis a augulectus, accumsan ut convallis id, lobortis vitae justous felis a augue commods, accumsan ut convallis id, lobortis vitae justous felis a augue commodo euismod. Pellentesque elementum,umsan ut convallis id, lobortis vitae justous felis a augue commodo euismod. Pellentesque elementum, justo mollis lacinia commodo, libero nisi tincidunt libero, ac consectetur purus turpis commodo euismod. Pellentesque elementum, justo mollis lacinia commodo, libero nisi tincidunt libero, ac consectetur purus turpis in ipsum.",
    className,
  }: DescriptionSectionProps): ReactNode => {
    return (
      <Box className={cn("gap-8 justify-center items-stretch", className)}>
        <CustomText type="title" className="text-center text-primary-700">
          {"Description"}
        </CustomText>
        <Box className="relative ml-6 flex flex-row gap-2">
          <CustomText
            type="ratingText"
            className="absolute -left-8 -top-8 z-[1] text-[40px]"
          >
            {"📖"}
          </CustomText>
          <CustomText
            type="ratingText"
            className="flex-1 rounded-2xl border border-background-300 bg-background-50 p-4"
          >
            {text}
          </CustomText>
        </Box>
      </Box>
    );
  },
);

DescriptionSection.displayName = "DescriptionSection";
