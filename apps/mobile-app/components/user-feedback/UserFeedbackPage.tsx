import { type ReactElement, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { CustomText } from "@/components/custom-ui/CustomText";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Button, ButtonText } from "@/components/ui/button";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { cn } from "@/utils/cn";

const DEFAULT_SUBMIT_LABEL_KEY = "user_feedback.modal.submit";
const DEFAULT_SUCCESS_TITLE_KEY = "user_feedback.modal.success_title";
const DEFAULT_SUCCESS_MESSAGE_KEY = "user_feedback.modal.success_message";

interface UserFeedbackPageProps {
  titleKey: string;
  subtitleKey: string;
  children: ReactNode;
  isPending: boolean;
  isSuccess: boolean;
  showSubmit?: boolean;
  isSubmitDisabled?: boolean;
  errorMessage?: string | null;
  submitLabelKey?: string;
  successTitleKey?: string;
  successMessageKey?: string;
  onClose: () => void;
  onSubmit: () => void;
  onBack?: () => void;
  onRetry?: () => void;
  onSuccessClose?: () => void;
}

const getSubmitLabel = (
  isPending: boolean,
  errorMessage: string | null | undefined,
  submitLabel: string,
  loadingLabel: string,
  retryLabel: string,
): string => {
  if (isPending) {
    return loadingLabel;
  }

  if (errorMessage !== null && errorMessage !== undefined) {
    return retryLabel;
  }

  return submitLabel;
};

export const UserFeedbackPage = ({
  titleKey,
  subtitleKey,
  children,
  isPending,
  isSuccess,
  showSubmit = true,
  isSubmitDisabled = false,
  errorMessage,
  submitLabelKey = DEFAULT_SUBMIT_LABEL_KEY,
  successTitleKey = DEFAULT_SUCCESS_TITLE_KEY,
  successMessageKey = DEFAULT_SUCCESS_MESSAGE_KEY,
  onClose,
  onSubmit,
  onBack,
  onRetry,
  onSuccessClose,
}: UserFeedbackPageProps): ReactElement => {
  const { t } = useTranslation("common");
  const closeHandler = isSuccess ? (onSuccessClose ?? onClose) : onClose;
  const submitLabel = getSubmitLabel(
    isPending,
    errorMessage,
    t(submitLabelKey),
    t("user_feedback.modal.loading"),
    t("user_feedback.modal.retry"),
  );
  const submitAction =
    errorMessage !== null && errorMessage !== undefined
      ? (onRetry ?? onSubmit)
      : onSubmit;

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background["50"].hex}
      withHeader={false}
      isTabScreen={false}
    >
      <View className="flex-row items-center justify-between border-b border-background-200 px-4 py-3">
        {onBack !== undefined && !isSuccess ? (
          <Pressable onPress={onBack} disabled={isPending} className="min-w-16">
            <CustomText className="text-base text-typography-500">
              {t("user_feedback.place_details.modal.back")}
            </CustomText>
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel={t("user_feedback.modal.close")}
            accessibilityRole="button"
            disabled={isPending}
            hitSlop={12}
            onPress={closeHandler}
            className="min-w-16"
          >
            <CloseIcon />
          </Pressable>
        )}

        <CustomText className="flex-1 text-center text-base font-semibold">
          {t(titleKey)}
        </CustomText>

        {showSubmit && !isSuccess ? (
          <Pressable
            onPress={submitAction}
            disabled={isPending || isSubmitDisabled}
            className={cn(
              "min-w-16 pl-6",
              (isPending || isSubmitDisabled) && "opacity-50",
            )}
          >
            <CustomText className="text-right text-base font-semibold text-primary-500">
              {submitLabel}
            </CustomText>
          </Pressable>
        ) : (
          <View className="min-w-16" />
        )}
      </View>

      {isSuccess ? (
        <View className="flex-1 items-center justify-center px-6">
          <CustomText type="title" className="text-center">
            {t(successTitleKey)}
          </CustomText>
          <CustomText className="mt-4 text-center text-base text-typography-600">
            {t(successMessageKey)}
          </CustomText>
          <Button action="submit" className="mt-8" onPress={closeHandler}>
            <ButtonText>{t("user_feedback.modal.close")}</ButtonText>
          </Button>
        </View>
      ) : (
        <KeyboardAwareScrollView
          bottomOffset={100}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          disableScrollOnKeyboardHide
        >
          <View className="flex-1 gap-4 p-6">
            <CustomText className="text-base text-typography-600">
              {t(subtitleKey)}
            </CustomText>

            {children}

            {errorMessage !== null && errorMessage !== undefined ? (
              <View className="rounded-2xl border border-error-200 bg-error-50 px-4 py-3">
                <CustomText className="text-sm text-error-700">
                  {errorMessage}
                </CustomText>
              </View>
            ) : null}
          </View>
        </KeyboardAwareScrollView>
      )}
    </CustomScreenContainer>
  );
};

UserFeedbackPage.displayName = "UserFeedbackPage";
