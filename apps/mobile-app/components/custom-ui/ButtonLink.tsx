import { type IButtonProps } from "@gluestack-ui/button/lib/types";
import { type Href, useRouter } from "expo-router";
import { memo, useCallback } from "react";

import { Button } from "../ui/button";

interface ButtonLinkProps extends IButtonProps {
  href: Href;
  children: React.ReactNode;
  className?: string;
}

export const ButtonLink = memo(
  ({ href, children, className, ...props }: ButtonLinkProps) => {
    const router = useRouter();
    const onPress = useCallback(() => {
      router.push(href);
    }, [href, router]);

    return (
      <Button onPress={onPress} className={className} size={"sm"} {...props}>
        {children}
      </Button>
    );
  },
);

ButtonLink.displayName = "ButtonLink";
