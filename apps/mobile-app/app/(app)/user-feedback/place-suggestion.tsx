import { router, useLocalSearchParams } from "expo-router";
import { type ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomTextarea } from "@/components/custom-ui/CustomTextarea";
import { Input, InputField } from "@/components/ui/input";
import { UserFeedbackPage } from "@/components/user-feedback/UserFeedbackPage";
import { useCreateUserFeedback } from "@/hooks/mutations/useCreateUserFeedback";
import { trackEvent } from "@/lib/analytics/analytics";
import { normalizeStringSearchParam } from "@/utils/searchParams";

export default function PlaceSuggestionRoute(): ReactElement {
  const { city } = useLocalSearchParams<{ city?: string | string[] }>();
  const { t } = useTranslation("common");
  const normalizedCity = normalizeStringSearchParam(city);
  const mutation = useCreateUserFeedback();

  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    void trackEvent("place_suggestion_started");
  }, []);

  const trimmedPlaceName = placeName.trim();
  const trimmedAddress = address.trim();
  const trimmedDescription = description.trim();

  const isSubmitDisabled =
    trimmedPlaceName.length === 0 || trimmedAddress.length === 0;

  const handleClose = (): void => {
    router.dismiss();
  };

  const handleSubmit = (): void => {
    void trackEvent("place_suggestion_submitted");

    mutation.mutate({
      category: "PLACE_SUGGESTION",
      message: "",
      city: normalizedCity ?? undefined,
      payload: {
        placeName: trimmedPlaceName,
        address: trimmedAddress,
        description:
          trimmedDescription.length > 0 ? trimmedDescription : undefined,
      },
    });
  };

  return (
    <UserFeedbackPage
      titleKey="user_feedback.place_suggestion.modal.title"
      subtitleKey="user_feedback.place_suggestion.modal.subtitle"
      submitLabelKey="user_feedback.place_suggestion.modal.submit"
      successTitleKey="user_feedback.place_suggestion.modal.success_title"
      successMessageKey="user_feedback.place_suggestion.modal.success_message"
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
          {"🏷️ "}
          {t("user_feedback.place_suggestion.modal.place_name_label")}
        </CustomText>
        <Input className="rounded-2xl border border-background-300 bg-background-50">
          <InputField
            autoFocus
            value={placeName}
            onChangeText={(value: string) => {
              setPlaceName(value);
              if (mutation.isError) mutation.reset();
            }}
            placeholder={t(
              "user_feedback.place_suggestion.modal.place_name_placeholder",
            )}
          />
        </Input>
      </View>

      <View className="gap-3">
        <CustomText className="text-sm font-semibold text-typography-900">
          {"📍 "}
          {t("user_feedback.place_suggestion.modal.address_label")}
        </CustomText>
        <Input className="rounded-2xl border border-background-300 bg-background-50">
          <InputField
            value={address}
            onChangeText={(value: string) => {
              setAddress(value);
              if (mutation.isError) mutation.reset();
            }}
            placeholder={t(
              "user_feedback.place_suggestion.modal.address_placeholder",
            )}
          />
        </Input>
      </View>

      <View className="gap-3">
        <CustomText className="text-sm font-semibold text-typography-900">
          {"📝 "}
          {t("user_feedback.place_suggestion.modal.description_label")}
        </CustomText>
        <CustomTextarea
          placeholder={t(
            "user_feedback.place_suggestion.modal.description_placeholder",
          )}
          value={description}
          onChange={(value) => {
            setDescription(value);
            if (mutation.isError) mutation.reset();
          }}
        />
      </View>
    </UserFeedbackPage>
  );
}
