import { type ReactElement, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import {
  CustomTextarea,
  type CustomTextareaRef,
} from "@/components/custom-ui/CustomTextarea";

interface CommentStepProps {
  message: string;
  onChangeMessage: (value: string) => void;
}

export const CommentStep = ({
  message,
  onChangeMessage,
}: CommentStepProps): ReactElement => {
  const { t } = useTranslation("common");
  const textareaRef = useRef<CustomTextareaRef>(null);

  useEffect(() => {
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, []);

  return (
    <View className="gap-3">
      <CustomText className="text-sm font-semibold text-typography-900">
        {t("user_feedback.place_details.modal.free_text_label")}
      </CustomText>
      <CustomTextarea
        ref={textareaRef}
        autoFocus
        placeholder={t(
          "user_feedback.place_details.modal.free_text_placeholder",
        )}
        value={message}
        onChange={onChangeMessage}
      />
    </View>
  );
};

CommentStep.displayName = "CommentStep";
