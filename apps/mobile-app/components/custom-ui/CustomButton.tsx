import { tva } from "@gluestack-ui/nativewind-utils/tva";
import { memo } from "react";
import { View } from "react-native";

import { shadowStyles } from "@/styles/shadows";
import { cn } from "@/utils/cn";

import { Button, ButtonText } from "../ui/button";

const button = tva({
  base: "flex h-16 justify-center items-center gap-3 self-stretch px-[30px] rounded-lg border-2 border-solid",
  variants: {
    type: {
      submit:
        "border-primary-700 bg-primary-400 disabled:border-background-600 disabled:bg-background-400",
      social: "border-black bg-white data-[active=true]:border-gray-400",
    },
  },
  defaultVariants: {
    type: "submit",
  },
});

const text = tva({
  base: "text-2xl font-bold",
  variants: {
    type: {
      submit: "text-background-50 disabled:text-background-600",
      social:
        "text-gray-700 disabled:text-gray-400 data-[active=true]:text-gray-400",
    },
  },
  defaultVariants: {
    type: "submit",
  },
});

interface CustomButtonProps extends React.ComponentProps<typeof Button> {
  label: string;
  type?: "submit" | "social";
  className?: string;
  icon?: React.ReactNode;
}

export const CustomButton = memo(
  ({
    label,
    className,
    type = "submit",
    icon,
    isDisabled = false,
    ...props
  }: CustomButtonProps) => {
    return (
      <Button
        style={
          type === "submit" && !isDisabled
            ? shadowStyles.buttonSubmit
            : undefined
        }
        className={cn(
          button({
            type,
          }),
          className,
        )}
        isDisabled={isDisabled}
        {...props}
      >
        {Boolean(icon) && (
          <View
            className={cn("flex items-center justify-center size")}
            style={{
              width: 24,
              height: 24,
            }}
          >
            {icon}
          </View>
        )}
        <ButtonText
          className={text({
            type,
          })}
        >
          {label}
        </ButtonText>
      </Button>
    );
  },
);

CustomButton.displayName = "CustomButton";
