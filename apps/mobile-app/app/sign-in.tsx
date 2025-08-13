import * as WebBrowser from "expo-web-browser";
import { type ReactElement, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PixelRatio, Platform } from "react-native";

import { CustomButton } from "@/components/custom-ui/CustomButton";
import { CustomImage } from "@/components/custom-ui/CustomImage";
import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { VStack } from "@/components/ui/vstack";
import { useAppleLoginMutation } from "@/hooks/mutations/useAppleLoginMutation";
import { useGoogleLoginMutation } from "@/hooks/mutations/useGoogleLoginMutation";
import { logger } from "@/utils/logger";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
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
      appleLoginMutate();
    }
  }, [appleLoginMutate, loginPending]);

  const googleLogin = useCallback(() => {
    if (!loginPending) {
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
        //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- it's ok for loading assets
        source={require("../assets/images/google-logo.png")}
        alt="Google Logo"
        style={{
          width: 20,
          height: 20,
          resizeMode: "contain",
        }}
      />
    ),
    [],
  );

  const appleIcon = useMemo(
    () => (
      <CustomImage
        //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- it's ok for loading assets
        source={require("../assets/images/apple-logo.png")}
        alt="Apple Logo"
        style={{
          width: 20,
          height: 20,
          resizeMode: "contain",
        }}
      />
    ),
    [],
  );

  const appleButton = useMemo(
    () => (
      <CustomButton
        type="social"
        label={t("auth.sign_in_with_apple")}
        onPress={appleLogin}
        isDisabled={loginPending}
        className="w-full"
        icon={appleIcon}
      />
    ),
    [t, appleLogin, loginPending, appleIcon],
  );

  const googleButton = useMemo(
    () => (
      <CustomButton
        type="social"
        label={t("auth.sign_in_with_google")}
        onPress={googleLogin}
        isDisabled={loginPending}
        className="w-full"
        icon={googleIcon}
      />
    ),
    [t, googleLogin, loginPending, googleIcon],
  );

  logger("pixel ratio native", PixelRatio.get());
  // logger("pixel ratio nativewind", pixelRatio(1));

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
            //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- it's ok for loading assets
            source={require("../assets/images/full-icon-with-text.png")}
            alt={"Vagabond App Logo"}
            style={{
              width: 1000, // to fill max height value
              height: 125,
              resizeMode: "contain",
            }}
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
