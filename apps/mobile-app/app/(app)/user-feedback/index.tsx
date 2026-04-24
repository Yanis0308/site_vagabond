import { router, useLocalSearchParams } from "expo-router";
import { type ReactElement, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomTextarea } from "@/components/custom-ui/CustomTextarea";
import { OptionChip } from "@/components/place-details/user-feedback-modal/OptionChip";
import {
  buildMapFeedbackInput,
  MAP_FEEDBACK_MAX_MESSAGE_LENGTH,
  MAP_FEEDBACK_MIN_MESSAGE_LENGTH,
  MAP_FEEDBACK_OPTIONS,
  type MapFeedbackType,
} from "@/components/user-feedback/map-feedback";
import { UserFeedbackPage } from "@/components/user-feedback/UserFeedbackPage";
import { useCreateUserFeedback } from "@/hooks/mutations/useCreateUserFeedback";

const getCityParam = (city: string | string[] | undefined): string | null => {
  const normalizedCity = Array.isArray(city) ? city[0] : city;

  if (normalizedCity === undefined) {
    return null;
  }

  const trimmedCity = normalizedCity.trim();

  return trimmedCity === "" ? null : trimmedCity;
};

export default function UserFeedbackMapRoute(): ReactElement {
  const { city } = useLocalSearchParams<{ city?: string | string[] }>();
  const { t } = useTranslation("common");
  const normalizedCity = getCityParam(city);
  const mutation = useCreateUserFeedback();
  const [selectedType, setSelectedType] = useState<MapFeedbackType | null>(
    null,
  );
  const [message, setMessage] = useState<string>("");

  const trimmedMessage = message.trim();
  const messageLength = trimmedMessage.length;
  const selectedOption =
    selectedType === null
      ? null
      : (MAP_FEEDBACK_OPTIONS.find((option) => option.value === selectedType) ??
        null);
  const isMessageTooShort =
    trimmedMessage.length > 0 &&
    trimmedMessage.length < MAP_FEEDBACK_MIN_MESSAGE_LENGTH;
  const isSubmitDisabled =
    selectedOption === null ||
    trimmedMessage.length < MAP_FEEDBACK_MIN_MESSAGE_LENGTH;
  const placeholder = useMemo(() => {
    if (selectedOption === null) {
      return t("user_feedback.map.modal.placeholder_default");
    }

    return t(selectedOption.placeholderKey);
  }, [selectedOption, t]);

  const handleClose = (): void => {
    router.back();
  };

  const handleSubmit = (): void => {
    if (
      selectedType === null ||
      trimmedMessage.length < MAP_FEEDBACK_MIN_MESSAGE_LENGTH
    ) {
      return;
    }

    mutation.mutate(
      buildMapFeedbackInput(selectedType, trimmedMessage, normalizedCity),
    );
  };

  return (
    <UserFeedbackPage
      titleKey="user_feedback.map.modal.title"
      subtitleKey="user_feedback.map.modal.subtitle"
      submitLabelKey="user_feedback.map.modal.submit"
      successTitleKey="user_feedback.map.modal.success_title"
      successMessageKey="user_feedback.map.modal.success_message"
      isPending={mutation.isPending}
      isSuccess={mutation.isSuccess}
      isSubmitDisabled={isSubmitDisabled}
      errorMessage={mutation.error?.message}
      onClose={handleClose}
      onSubmit={handleSubmit}
      onRetry={handleSubmit}
      onSuccessClose={handleClose}
    >
      <View className="gap-3">
        <CustomText className="text-sm font-semibold text-typography-900">
          {t("user_feedback.map.modal.type_label")}
        </CustomText>
        {MAP_FEEDBACK_OPTIONS.map((option) => {
          return (
            <OptionChip
              key={option.value}
              label={t(option.labelKey)}
              isSelected={selectedType === option.value}
              onPress={() => {
                setSelectedType(option.value);
                if (mutation.isError) {
                  mutation.reset();
                }
              }}
            />
          );
        })}
      </View>

      <View className="gap-3">
        <CustomText className="text-sm font-semibold text-typography-900">
          {t("user_feedback.map.modal.message_label")}
        </CustomText>
        <CustomTextarea
          placeholder={placeholder}
          value={message}
          isInvalid={isMessageTooShort}
          onChange={(value) => {
            const nextValue = value.slice(0, MAP_FEEDBACK_MAX_MESSAGE_LENGTH);
            setMessage(nextValue);
            if (mutation.isError) {
              mutation.reset();
            }
          }}
        />
        <View className="flex-row items-center justify-between">
          <CustomText
            className={
              isMessageTooShort
                ? "text-sm text-error-700"
                : "text-sm text-typography-500"
            }
          >
            {t("user_feedback.map.modal.message_helper", {
              min: MAP_FEEDBACK_MIN_MESSAGE_LENGTH,
              max: MAP_FEEDBACK_MAX_MESSAGE_LENGTH,
            })}
          </CustomText>
          <CustomText className="text-sm text-typography-500">
            {t("user_feedback.map.modal.character_count", {
              count: messageLength,
              max: MAP_FEEDBACK_MAX_MESSAGE_LENGTH,
            })}
          </CustomText>
        </View>
      </View>
    </UserFeedbackPage>
  );
}
