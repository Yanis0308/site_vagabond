import { memo, type ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { useDeleteAccountMutation } from "@/hooks/mutations/useDeleteAccountMutation";
import { logger } from "@/utils/logger";

export const ProfileDeleteAccountButton = memo((): ReactElement => {
  const { t } = useTranslation("common");
  const { mutate: deleteAccount, isPending } = useDeleteAccountMutation();

  const handleConfirm = useCallback(() => {
    deleteAccount(undefined, {
      onError: (error) => {
        logger("Error deleting account", error);
        Alert.alert(
          t("delete_account_error_title"),
          t("delete_account_error_message"),
        );
      },
    });
  }, [deleteAccount, t]);

  const handlePress = useCallback(() => {
    Alert.alert(
      t("delete_account_confirm_title"),
      t("delete_account_confirm_message"),
      [
        { text: t("delete_account_confirm_no"), style: "cancel" },
        {
          text: t("delete_account_confirm_yes"),
          style: "destructive",
          onPress: handleConfirm,
        },
      ],
    );
  }, [t, handleConfirm]);

  return (
    <Box className="items-center justify-center py-2">
      <Button
        onPress={handlePress}
        isDisabled={isPending}
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
