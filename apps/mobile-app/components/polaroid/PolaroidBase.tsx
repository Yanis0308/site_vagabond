import { type ImageProps } from "expo-image";
import { memo, useEffect, useState } from "react";

import { shadowStyles } from "@/styles/shadows";
import { cn } from "@/utils/cn";

import { CustomImage } from "../custom-ui/CustomImage";
import { Box } from "../ui/box";

interface PolaroidBaseProps {
  imageUrl: ImageProps["source"];
  children: React.ReactNode;
  imageWithBorder: boolean;
  maintainAspectRatio: boolean;
  isSmall: boolean;
  className?: string;
}

export const PolaroidBase = memo(
  ({
    imageUrl,
    className,
    children,
    imageWithBorder,
    maintainAspectRatio,
    isSmall,
  }: PolaroidBaseProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
      setIsLoaded(true);
    }, []);

    return (
      <Box
        style={isSmall ? shadowStyles.ratingBlock : shadowStyles.polaroidBlock}
        className={cn(
          "rotate-[-2.85deg] rounded-2xl bg-background-50",
          isSmall ? "p-2 w-[60vw]" : "p-4 w-[90%]",
          className,
        )}
      >
        <Box
          className={cn(
            "w-full self-center",
            maintainAspectRatio ? "aspect-[3/4]" : "aspect-[1/1]",
            imageWithBorder && "border border-gray-100",
          )}
        >
          <CustomImage
            source={imageUrl}
            height="full"
            width="full"
            className={cn(
              "transition-opacity delay-150 duration-1000 ease-in-out",
              isLoaded ? "opacity-100" : "opacity-0",
              isSmall && "rounded-lg",
            )}
            contentFit={isSmall ? "cover" : "contain"}
            showLoader={true}
          />
        </Box>
        {children}
      </Box>
    );
  },
);

PolaroidBase.displayName = "PolaroidBase";
