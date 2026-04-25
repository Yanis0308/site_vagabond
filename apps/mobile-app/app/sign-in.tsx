import * as WebBrowser from "expo-web-browser";
import { type ReactElement, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { VStack } from "@/components/ui/vstack";
import { useAppleLoginMutation } from "@/hooks/mutations/useAppleLoginMutation";
import { useGoogleLoginMutation } from "@/hooks/mutations/useGoogleLoginMutation";
import { trackEvent } from "@/lib/analytics/analytics";
import { localImages } from "@/utils/localImages";

export default function SignInScreen(): ReactElement {
  const { t } = useTranslation("common");
  const { isPending: googleLoginPending, mutate: googleLoginMutate } =
    useGoogleLoginMutation();
  const { isPending: appleLoginPending, mutate: appleLoginMutate } =
    useAppleLoginMutation();

  const loginPending = useMemo(() => {
    return googleLoginPending || appleLoginPending;
  }, [googleLoginPending, appleLoginPending]);

  const appleLogin = useCallback(() => {
    if (!loginPending) {
      void trackEvent("sign_in_started", { method: "apple" });
      appleLoginMutate();
    }
  }, [appleLoginMutate, loginPending]);

  const googleLogin = useCallback(() => {
    if (!loginPending) {
      void trackEvent("sign_in_started", { method: "google" });
      googleLoginMutate();
    }
  }, [googleLoginMutate, loginPending]);

  useEffect(() => {
    void WebBrowser.warmUpAsync();

    return (): void => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const googleIcon = useMemo(
    () => (
      <CustomImage
        sources={localImages.googleLogo}
        alt="Google Logo"
        height={20}
        width={20}
        contentFit="contain"
        showLoader={false}
      />
    ),
    [],
  );

  const appleIcon = useMemo(
    () => (
      <CustomImage
        sources={localImages.appleLogo}
        alt="Apple Logo"
        height={20}
        width={20}
        contentFit="contain"
        showLoader={false}
      />
    ),
    [],
  );

  const appleButton = useMemo(
    () => (
      <Button
        action="login"
        onPress={appleLogin}
        isDisabled={loginPending}
        className="w-full"
      >
        {appleIcon}
        <ButtonText adjustsFontSizeToFit numberOfLines={1}>
          {t("auth.sign_in_with_apple")}
        </ButtonText>
      </Button>
    ),
    [t, appleLogin, loginPending, appleIcon],
  );

  const googleButton = useMemo(
    () => (
      <Button
        action="login"
        onPress={googleLogin}
        isDisabled={loginPending}
        className="w-full"
      >
        {googleIcon}
        <ButtonText adjustsFontSizeToFit numberOfLines={1}>
          {t("auth.sign_in_with_google")}
        </ButtonText>
      </Button>
    ),
    [t, googleLogin, loginPending, googleIcon],
  );

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background["200"].hex}
      withHeader={false}
      isTabScreen={false}
    >
      <Box className={"flex flex-1 items-center justify-center gap-4"}>
        <VStack className={"items-center gap-4"}>
          <CustomImage
            sources={localImages.fullIconWithText}
            alt={"Vagabond App Logo"}
            height={125}
            width={1000} // to fill max height value
            contentFit="contain"
            showLoader={false}
          />
          <CustomText size={"xl"}>{t("auth.sign_in_to_start")}</CustomText>
          <Box
            className={"flex animate-bounce items-center justify-center pt-2"}
          >
            <CustomText className={"text-[50px]"}>{"👇"}</CustomText>
          </Box>
        </VStack>
        <VStack className={"w-full items-center justify-stretch gap-4 px-8"}>
          {Platform.OS === "ios" ? (
            <>
              {appleButton}
              {googleButton}
            </>
          ) : (
            <>
              {googleButton}
              {appleButton}
            </>
          )}
        </VStack>
      </Box>
    </CustomScreenContainer>
  );
}
