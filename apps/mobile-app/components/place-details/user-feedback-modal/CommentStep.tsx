import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomTextarea } from "@/components/custom-ui/CustomTextarea";
import { Button, ButtonText } from "@/components/ui/button";

interface CommentStepProps {
  message: string;
  onChangeMessage: (value: string) => void;
  onBack: () => void;
}

export const CommentStep = ({
  message,
  onChangeMessage,
  onBack,
}: CommentStepProps): ReactElement => {
  const { t } = useTranslation("common");

  return (
    <View>
      <View className="gap-3">
        <CustomText className="text-sm font-semibold text-typography-900">
          {t("user_feedback.place_details.modal.free_text_label")}
        </CustomText>
        <CustomTextarea
          placeholder={t(
            "user_feedback.place_details.modal.free_text_placeholder",
          )}
          value={message}
          onChange={onChangeMessage}
        />
      </View>

      <Button
        action="secondary"
        size="medium"
        className="mt-6"
        onPress={onBack}
      >
        <ButtonText>{t("user_feedback.place_details.modal.back")}</ButtonText>
      </Button>
    </View>
  );
};

CommentStep.displayName = "CommentStep";
