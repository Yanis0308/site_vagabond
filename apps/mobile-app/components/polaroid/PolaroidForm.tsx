import { memo } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/utils/cn";
import { getPlainTextDate } from "@/utils/date";

import { CustomImage } from "../custom-ui/CustomImage";
import { CustomText } from "../custom-ui/CustomText";
import { Box } from "../ui/box";
import { Text } from "../ui/text";
import { PolaroidBase } from "./PolaroidBase";

interface PolaroidFormProps {
  imageUrl: string;
  title: string;
  className?: string;
}

export const PolaroidForm = memo(
  ({ imageUrl, title, className }: PolaroidFormProps) => {
    const { i18n } = useTranslation();

    return (
      <PolaroidBase
        imageUrl={imageUrl}
        className={cn(className, "mt-4")}
        imageWithBorder={true}
        maintainAspectRatio={true}
        isSmall={false}
      >
        <Box className="items-center justify-center gap-2 p-2">
          <CustomText type="title" className="text-center text-primary-500">
            {title}
          </CustomText>
          <Text className="text-center text-sm text-gray-500">
            {getPlainTextDate({ locale: i18n.language })}
          </Text>
        </Box>
        <CustomImage
          source={
            "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Star%20Struck.webp"
          }
          className="absolute -bottom-3 -left-5 size-[60px]"
        />
      </PolaroidBase>
    );
  },
);

PolaroidForm.displayName = "PolaroidForm";
