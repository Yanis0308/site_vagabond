import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ReactElement, useEffect } from "react";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSession } from "@/contexts/AuthContext";
import { useLoginMutation } from "@/hooks/mutations/useLoginMutation";
import { logger } from "@/utils/logger";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
export default function SignInScreen(): ReactElement {
  const { isPending, mutate } = useLoginMutation();
  const { session } = useSession();

  logger("=== in sign-in, session:", session);

  useEffect(() => {
    if (session !== null) {
      router.replace("/");
    }
  }, [session]);

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
          //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- will fix later
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
          //eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
          onPress={() => {
            mutate();
          }}
          disabled={isPending}
        />
      </VStack>
    </Box>
  );
}
