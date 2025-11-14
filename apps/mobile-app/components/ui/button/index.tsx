"use client";
import React, { useCallback } from "react";
import { createButton } from "@gluestack-ui/core/button/creator";
import {
  tva,
  withStyleContext,
  useStyleContext,
  type VariantProps,
} from "@gluestack-ui/utils/nativewind-utils";
import { cssInterop } from "nativewind";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { PrimitiveIcon, UIIcon } from "@gluestack-ui/core/icon/creator";
import { type Href, useRouter } from "expo-router";

import { shadowStyles } from "@/styles/shadows";

const SCOPE = "BUTTON";

const Root = withStyleContext(Pressable, SCOPE);

const UIButton = createButton({
  Root: Root,
  Text,
  Group: View,
  Spinner: ActivityIndicator,
  Icon: UIIcon,
});

cssInterop(PrimitiveIcon, {
  className: {
    target: "style",
    nativeStyleToProp: {
      height: true,
      width: true,
      fill: true,
      color: "classNameColor",
      stroke: true,
    },
  },
});

// Configuration des shadows par action
const BUTTON_SHADOWS = {
  link: shadowStyles.ratingBlock,
  submit: shadowStyles.buttonSubmit,
} as const;

// Helper pour obtenir le shadow selon l'action et l'état
const getButtonShadow = (action: string, isDisabled?: boolean) => {
  if (isDisabled) return undefined;
  return BUTTON_SHADOWS[action as keyof typeof BUTTON_SHADOWS];
};

const buttonStyle = tva({
  base: "group/button rounded bg-primary-500 flex-row items-center justify-center data-[focus-visible=true]:web:outline-none data-[focus-visible=true]:web:ring-2 data-[disabled=true]:opacity-40 gap-2",
  variants: {
    action: {
      primary:
        "bg-primary-500 data-[hover=true]:bg-primary-600 data-[active=true]:bg-primary-700 border-primary-300 data-[hover=true]:border-primary-400 data-[active=true]:border-primary-500 data-[focus-visible=true]:web:ring-indicator-info",
      secondary:
        "bg-secondary-500 border-secondary-300 data-[hover=true]:bg-secondary-600 data-[hover=true]:border-secondary-400 data-[active=true]:bg-secondary-700 data-[active=true]:border-secondary-700 data-[focus-visible=true]:web:ring-indicator-info",
      submit:
        "border-primary-700 bg-primary-400 disabled:border-background-600 disabled:bg-background-400",
      login: "border-black bg-white data-[active=true]:border-gray-400",
      link: "border-black bg-white data-[active=true]:border-gray-400",
      text: "bg-transparent border-0 border-transparent p-0 h-auto rounded-none",
      mapAction:
        "rounded-full border-2 border-background-200 bg-background-100 p-2 data-[hover=true]:bg-background-200 data-[active=true]:bg-background-300",
    },
    size: {
      default:
        "h-16 gap-3 self-stretch px-[30px] rounded-lg border-2 border-solid",
      medium: "h-12 gap-3 self-stretch px-[30px] rounded-lg",
      small: "px-4 h-9",
      none: "",
    },
  },
  compoundVariants: [],
});

const buttonTextStyle = tva({
  base: "text-typography-0 font-semibold web:select-none text-background-50 disabled:text-background-600",
  parentVariants: {
    action: {
      primary:
        "data-[hover=true]:text-primary-600 data-[active=true]:text-primary-700",
      secondary:
        "data-[hover=true]:text-typography-600 data-[active=true]:text-typography-700",
      submit: "",
      login:
        "text-gray-700 disabled:text-gray-400 data-[active=true]:text-gray-400",
      link: "text-gray-700 disabled:text-gray-400 data-[active=true]:text-gray-400",
      text: "text-gray-700 underline disabled:text-gray-400 data-[active=true]:text-gray-400",
      mapAction: "text-burntOrange-700",
    },
    size: {
      default: "text-2xl font-bold",
      medium: "text-xl font-semibold",
      small: "text-sm font-semibold",
    },
  },
  parentCompoundVariants: [],
});

const buttonIconStyle = tva({
  base: "fill-none h-6 w-6",
  parentVariants: {
    size: {
      default: "",
      small: "h-4 w-4",
      medium: "h-6 w-6",
    },
    action: {
      primary:
        "text-primary-600 data-[hover=true]:text-primary-600 data-[active=true]:text-primary-700",
      secondary:
        "text-typography-500 data-[hover=true]:text-typography-600 data-[active=true]:text-typography-700",
      submit: "text-background-50",
      login: "text-gray-700",
      link: "text-gray-700",
      text: "text-gray-700",
      mapAction: "text-burntOrange-700",
    },
  },
  parentCompoundVariants: [],
});

const buttonGroupStyle = tva({
  base: "",
  variants: {
    space: {
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
      xl: "gap-5",
      "2xl": "gap-6",
      "3xl": "gap-7",
      "4xl": "gap-8",
    },
    isAttached: {
      true: "gap-0",
    },
    flexDirection: {
      row: "flex-row",
      column: "flex-col",
      "row-reverse": "flex-row-reverse",
      "column-reverse": "flex-col-reverse",
    },
  },
});

type IButtonProps = Omit<
  React.ComponentPropsWithoutRef<typeof UIButton>,
  "context"
> &
  VariantProps<typeof buttonStyle> & {
    className?: string;
    href?: string | null;
  };

const Button = React.forwardRef<
  React.ElementRef<typeof UIButton>,
  IButtonProps
>(
  (
    {
      className,
      size = "default",
      action = "primary",
      href,
      onPress,
      ...props
    },
    ref,
  ) => {
    const navigationHandler = useNavigationHandler(href ?? undefined);

    const handlePress = useCallback(
      (event: any) => {
        // Appeler onPress d'abord si défini
        if (onPress) {
          onPress(event);
        }
        // Puis naviguer si href est défini
        if (href !== null && href !== undefined) {
          navigationHandler();
        }
      },
      [onPress, href, navigationHandler],
    );

    return (
      <UIButton
        ref={ref}
        {...props}
        style={getButtonShadow(action, props.isDisabled)}
        className={buttonStyle({
          size,
          action,
          class: className,
        })}
        context={{
          size,
          action,
        }}
        onPress={handlePress}
      />
    );
  },
);

type IButtonTextProps = React.ComponentPropsWithoutRef<typeof UIButton.Text> &
  VariantProps<typeof buttonTextStyle> & { className?: string };

const ButtonText = React.forwardRef<
  React.ElementRef<typeof UIButton.Text>,
  IButtonTextProps
>(({ className, size, action, ...props }, ref) => {
  const { size: parentSize, action: parentAction } = useStyleContext(SCOPE);

  return (
    <UIButton.Text
      ref={ref}
      {...props}
      className={buttonTextStyle({
        parentVariants: {
          size: parentSize,
          action: parentAction,
        },
        size,
        action,
        class: className,
      })}
    />
  );
});

const ButtonSpinner = UIButton.Spinner;

type IButtonIcon = React.ComponentPropsWithoutRef<typeof UIButton.Icon> &
  VariantProps<typeof buttonIconStyle> & {
    className?: string | undefined;
    as?: React.ElementType;
    height?: number;
    width?: number;
  };

const ButtonIcon = React.forwardRef<
  React.ElementRef<typeof UIButton.Icon>,
  IButtonIcon
>(({ className, size, ...props }, ref) => {
  const { size: parentSize, action: parentAction } = useStyleContext(SCOPE);

  if (typeof size === "number") {
    return (
      <UIButton.Icon
        ref={ref}
        {...props}
        className={buttonIconStyle({ class: className })}
        size={size}
      />
    );
  } else if (
    (props.height !== undefined || props.width !== undefined) &&
    size === undefined
  ) {
    return (
      <UIButton.Icon
        ref={ref}
        {...props}
        className={buttonIconStyle({ class: className })}
      />
    );
  }
  return (
    <UIButton.Icon
      {...props}
      className={buttonIconStyle({
        parentVariants: {
          size: parentSize,
          action: parentAction,
        },
        size,
        class: className,
      })}
      ref={ref}
    />
  );
});

type IButtonGroupProps = Omit<
  React.ComponentPropsWithoutRef<typeof UIButton.Group>,
  "className" | "children"
> &
  VariantProps<typeof buttonGroupStyle> & {
    className?: string;
    children?: React.ReactNode;
  };

const ButtonGroup = React.forwardRef<
  React.ElementRef<typeof UIButton.Group>,
  IButtonGroupProps
>(
  (
    {
      className,
      space = "md",
      isAttached = false,
      flexDirection = "column",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <UIButton.Group
        className={buttonGroupStyle({
          class: className,
          space,
          isAttached,
          flexDirection,
        })}
        {...props}
        ref={ref}
      >
        {children}
      </UIButton.Group>
    );
  },
);

// Hook pour créer un handler de navigation
const useNavigationHandler = (href?: string): (() => void) => {
  const router = useRouter();

  return useCallback(() => {
    if (href !== null && href !== undefined) {
      router.push(href as Href);
    }
  }, [href, router]);
};

Button.displayName = "Button";
ButtonText.displayName = "ButtonText";
ButtonSpinner.displayName = "ButtonSpinner";
ButtonIcon.displayName = "ButtonIcon";
ButtonGroup.displayName = "ButtonGroup";

export {
  Button,
  ButtonText,
  ButtonSpinner,
  ButtonIcon,
  ButtonGroup,
  useNavigationHandler,
};
