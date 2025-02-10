import { AppleButton } from "@invertase/react-native-apple-authentication";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import * as WebBrowser from "expo-web-browser";
import { type ReactElement, useCallback, useEffect, useMemo } from "react";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAppleLoginMutation } from "@/hooks/mutations/useAppleLoginMutation";
import { useGoogleLoginMutation } from "@/hooks/mutations/useGoogleLoginMutation";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
export default function SignInScreen(): ReactElement {
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

  useEffect(() => {
    void WebBrowser.warmUpAsync();

    return (): void => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  return (
    <Box className={"flex size-full items-center gap-4 bg-cyan-700"}>
      <VStack className={"items-center pt-[50%]"}>
        <CustomImage
          //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports -- will fix later
          source={require("../assets/images/cropped_logo.jpg")}
          alt={"Vagabond app logo"}
          className={"size-52"}
        />
        <Heading size={"3xl"} className={"pt-5 text-center text-white"}>
          Vagabond
        </Heading>
        <Text size={"xl"} className={"text-white"}>
          Welcome to the neo-tourism !
        </Text>
      </VStack>
      <VStack>
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={googleLoginMutate}
          disabled={loginPending}
        />
        <AppleButton
          buttonStyle={AppleButton.Style.WHITE}
          buttonType={AppleButton.Type.SIGN_IN}
          style={{
            width: 160, // You must specify a width
            height: 45, // You must specify a height
            opacity: loginPending ? 50 : undefined,
          }}
          onPress={appleLogin}
        />
      </VStack>
    </Box>
  );
}
