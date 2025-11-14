import { getAuth } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { memo, type ReactElement, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { logger } from "@/utils/logger";

export const ProfileSignOutButton = memo((): ReactElement => {
  const { t } = useTranslation("common");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      try {
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

  return (
    <Box className="items-center justify-center py-4">
      <Button
        onPress={signOut}
        isDisabled={isSigningOut}
        action="text"
        size="none"
      >
        <ButtonText>{t("sign_out")}</ButtonText>
      </Button>
    </Box>
  );
});

ProfileSignOutButton.displayName = "ProfileSignOutButton";
