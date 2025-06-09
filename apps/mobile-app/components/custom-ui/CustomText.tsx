import { tva } from "@gluestack-ui/nativewind-utils/tva";
import { memo } from "react";

import { cn } from "@/utils/cn";

import { Text } from "../ui/text";

const text = tva({
  base: "",
  variants: {
    type: {
      title: "text-2xl font-semibold leading-[133.346%]",
      rating: "text-xs not-italic font-bold leading-[normal];",
    },
  },
});
export const CustomText = memo(
  ({
    children,
    className,
    type,
    ...props
  }: {
    children: React.ReactNode;
    type?: "title" | "rating";
    className?: string;
  } & React.ComponentProps<typeof Text>) => {
    return (
      <Text className={cn(text({ type }), className)} {...props}>
        {children}
      </Text>
    );
  },
);

CustomText.displayName = "CustomText";
