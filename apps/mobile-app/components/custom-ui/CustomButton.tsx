import { tva } from "@gluestack-ui/nativewind-utils/tva";
import { memo } from "react";

import { cn } from "@/utils/cn";

import { Button, ButtonText } from "../ui/button";

const button = tva({
  base: "flex h-16 justify-center items-center gap-3 self-stretch px-[30px] rounded-lg border-2 border-solid border-primary-700 bg-primary-400",
  variants: {
    type: {
      submit:
        "shadow-button-submit disabled:border-background-600 disabled:bg-background-400 disabled:shadow-none active:shadow-none",
    },
  },
});

const text = tva({
  base: "text-2xl font-bold",
  variants: {
    type: {
      submit: "text-background-50 disabled:text-background-600",
    },
  },
});

interface CustomButtonProps extends React.ComponentProps<typeof Button> {
  label: string;
  type?: "submit";
  className?: string;
}

export const CustomButton = memo(
  ({
    label,
    className,
    type,
    isDisabled = false,
    ...props
  }: CustomButtonProps) => {
    return (
      <Button
        className={cn(
          button({
            type,
          }),
          className,
        )}
        isDisabled={isDisabled}
        {...props}
      >
        <ButtonText
          className={text({
            type,
          })}
          disabled={isDisabled}
        >
          {label}
        </ButtonText>
      </Button>
    );
  },
);

CustomButton.displayName = "CustomButton";
