import { getAuth } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import { type ReactElement, useCallback, useState } from "react";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { logger } from "@/utils/logger";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
export default function HomeScreen(): ReactElement {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      //TODO: on pourrait checker si l'utilisateur est connecté avec Google
      try {
        // Prevent sign-in with same Google account without asking
        await GoogleSignin.revokeAccess();
      } catch (error) {
        logger("Error GoogleSignin revoking access", error);
      }
      await getAuth().signOut();
      router.replace("/sign-in");
    } catch (error) {
      logger("Error signing out", error);
    } finally {
      setIsSigningOut(false);
    }
  }, []);

  const onPress = useCallback(() => void signOut, [signOut]);

  return (
    <Box className={"flex size-full items-center justify-center gap-4"}>
      <Text className={"text-2xl text-white"}>Welcome !</Text>
      <Text className={"text-green-500"}>Green text</Text>
      <Button disabled={isSigningOut}>
        <ButtonText onPress={onPress} disabled={isSigningOut}>
          Sign out
        </ButtonText>
      </Button>
    </Box>
  );
}
