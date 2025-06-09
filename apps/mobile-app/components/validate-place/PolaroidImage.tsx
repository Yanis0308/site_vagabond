import { Image } from "expo-image";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/utils/cn";
import { getPlainTextDate } from "@/utils/date";

import { CustomText } from "../custom-ui/CustomText";
import { Box } from "../ui/box";
import { Text } from "../ui/text";

interface PolaroidImageProps {
  imageUrl: string;
  title: string;
}

export const PolaroidImage = memo(({ imageUrl, title }: PolaroidImageProps) => {
  const { i18n } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <Box className="mt-4 w-[90%] rotate-[-2.85deg] rounded-2xl bg-background-50 p-4 shadow-[0_0px_12px_0px] shadow-shadow-polaroidBlock/50">
      <Box className="aspect-[3/4] border border-dashed border-gray-300">
        <Image
          source={imageUrl}
          className={cn(
            "w-full flex-1 transition-opacity delay-150 duration-1000 ease-in-out",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          contentFit="contain"
        />
      </Box>
      <Box className="items-center justify-center gap-2 p-2">
        <CustomText type="title" className="text-center text-primary-500">
          {title}
        </CustomText>
        <Text className="text-center text-sm text-gray-500">
          {getPlainTextDate({ locale: i18n.language })}
        </Text>
      </Box>
      <Image
        source={
          "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Star%20Struck.webp"
        }
        className="absolute -bottom-3 -left-5 size-[60px]"
      />
    </Box>
  );
});

PolaroidImage.displayName = "PolaroidImage";
