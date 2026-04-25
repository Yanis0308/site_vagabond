import { getAuth } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { memo, type ReactElement, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics/analytics";
import { logger } from "@/utils/logger";

export const ProfileSignOutButton = memo((): ReactElement => {
  const { t } = useTranslation("common");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    void trackEvent("sign_out");
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

  const handlePress = useCallback(() => {
    Alert.alert(t("sign_out_confirm_title"), t("sign_out_confirm_message"), [
      { text: t("sign_out_confirm_no"), style: "cancel" },
      {
        text: t("sign_out_confirm_yes"),
        style: "destructive",
        onPress: (): void => void signOut(),
      },
    ]);
  }, [t, signOut]);

  return (
    <Box className="items-center justify-center py-2">
      <Button
        onPress={handlePress}
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
