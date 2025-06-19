import { Image } from "expo-image";
import { memo, useEffect, useState } from "react";

import { cn } from "@/utils/cn";

import { Box } from "../ui/box";

interface PolaroidBaseProps {
  imageUrl: string;
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
        className={cn(
          "rotate-[-2.85deg] rounded-2xl bg-background-50",
          isSmall
            ? "p-2 w-[60vw] shadow-[0_4px_4px_-2px] shadow-shadow-ratingBlock"
            : "p-4 w-[90%] shadow-[0_0px_12px_0px] shadow-shadow-polaroidBlock/50",
          className,
        )}
      >
        <Box
          className={cn(
            "w-full self-center",
            maintainAspectRatio ? "aspect-[3/4]" : "aspect-[1/1]",
            imageWithBorder && "border border-dashed border-gray-300",
          )}
        >
          <Image
            source={imageUrl}
            className={cn(
              "w-full transition-opacity delay-150 duration-1000 ease-in-out h-full",
              isLoaded ? "opacity-100" : "opacity-0",
              isSmall && "rounded-lg",
            )}
            contentFit={"contain"}
          />
        </Box>
        {children}
      </Box>
    );
  },
);

PolaroidBase.displayName = "PolaroidBase";
