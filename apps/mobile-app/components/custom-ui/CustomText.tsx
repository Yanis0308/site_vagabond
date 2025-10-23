import { tva } from "@gluestack-ui/nativewind-utils/tva";
import { memo } from "react";

import { cn } from "@/utils/cn";

import { Text } from "../ui/text";

const text = tva({
  base: "",
  variants: {
    type: {
      title: "text-2xl font-semibold leading-[133%]",
      rating: "text-xs not-italic font-bold leading-[normal];",
      username: "text-xs font-medium leading-[133%];",
      placeTitle: "text-2xl font-bold",
      ratingText: "text-base font-normal leading-[133%]",
      tabBarTitle: "text-xs font-bold",
    },
  },
}) as (props?: { type?: string }) => string;
export const CustomText = memo(
  ({
    children,
    className,
    type,
    ...props
  }: {
    children: React.ReactNode;
    type?:
      | "title"
      | "rating"
      | "username"
      | "placeTitle"
      | "ratingText"
      | "tabBarTitle";
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
