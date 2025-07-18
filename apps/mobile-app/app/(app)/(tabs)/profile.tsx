import { getAuth } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { type ReactElement, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { CustomButton } from "@/components/custom-ui/CustomButton";
import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { logger } from "@/utils/logger";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
export default function HomeScreen(): ReactElement {
  const { t } = useTranslation("common");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      try {
        // Prevent sign-in with same Google account without asking
        await GoogleSignin.revokeAccess();
      } catch (error) {
        logger("Error GoogleSignin revoking access", error);
      }
      await getAuth().signOut();
    } catch (error) {
      logger("Error signing out", error);
      setIsSigningOut(false);
    }
  }, []);

  const onPress = useCallback(() => void signOut(), [signOut]);

  return (
    <Box className={"flex size-full items-center justify-center gap-4"}>
      <CustomText>{isSigningOut ? "Loading..." : "Can sign out"}</CustomText>
      <CustomButton
        onPress={onPress}
        disabled={isSigningOut}
        label={t("sign_out")}
        type="submit"
      />
    </Box>
  );
}
