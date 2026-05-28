import { Bell, X } from "lucide-react-native";
import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Button, ButtonText } from "@/components/ui/button";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Modal, ModalBackdrop } from "@/components/ui/modal";

interface PushPermissionPrePromptModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

export const PushPermissionPrePromptModal = ({
  isOpen,
  onAccept,
  onDismiss,
}: PushPermissionPrePromptModalProps): ReactElement => {
  const { t } = useTranslation("common");

  return (
    <Modal isOpen={isOpen} size="full" onClose={onDismiss}>
      <ModalBackdrop onPress={onDismiss} />
      <View className="w-full max-w-[85%] rounded-3xl bg-background-100 px-6 pb-6 pt-12 shadow-lg">
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={t(
            "notifications.push_permission_pre_prompt.close",
          )}
          hitSlop={8}
          className="
            absolute right-3 top-3 z-10 size-7 items-center justify-center rounded-full bg-background-200
            active:opacity-70
          "
        >
          <X
            size={16}
            color={themeColors.typography["500"].hex}
            strokeWidth={2}
          />
        </Pressable>

        <View className="mb-4 items-center">
          <View className="mb-3 size-14 items-center justify-center rounded-full bg-primary-50">
            <Bell
              size={28}
              color={themeColors.primary["600"].hex}
              strokeWidth={1.75}
            />
          </View>
          <CustomText
            type="title"
            className="mb-2 text-center text-typography-900"
          >
            {t("notifications.push_permission_pre_prompt.title")}
          </CustomText>
          <CustomText className="text-center text-base text-typography-500">
            {t("notifications.push_permission_pre_prompt.body")}
          </CustomText>
        </View>

        <View className="flex-row justify-end">
          <Button onPress={onAccept} action="primary">
            <ButtonText>
              {t("notifications.push_permission_pre_prompt.cta_accept")}
            </ButtonText>
          </Button>
        </View>
      </View>
    </Modal>
  );
};

PushPermissionPrePromptModal.displayName = "PushPermissionPrePromptModal";
