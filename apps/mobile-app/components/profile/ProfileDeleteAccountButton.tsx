import { getAuth } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { memo, type ReactElement, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { logger } from "@/utils/logger";

// TODO: implement real account deletion (API DELETE /me, Firebase delete, S3 cleanup) - required by Apple 5.1.1(v) - for now only signs out

export const ProfileDeleteAccountButton = memo((): ReactElement => {
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

  const handlePress = useCallback(() => {
    Alert.alert(
      t("delete_account_confirm_title"),
      t("delete_account_confirm_message"),
      [
        { text: t("delete_account_confirm_no"), style: "cancel" },
        {
          text: t("delete_account_confirm_yes"),
          style: "destructive",
          onPress: (): void => void signOut(),
        },
      ],
    );
  }, [t, signOut]);

  return (
    <Box className="items-center justify-center py-2">
      <Button
        onPress={handlePress}
        isDisabled={isSigningOut}
        action="text"
        size="none"
      >
        <ButtonText className="text-error-600">
          {t("delete_account")}
        </ButtonText>
      </Button>
    </Box>
  );
});

ProfileDeleteAccountButton.displayName = "ProfileDeleteAccountButton";
