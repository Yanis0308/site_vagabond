import { type ReactElement, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { CustomText } from "@/components/custom-ui/CustomText";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Button, ButtonText } from "@/components/ui/button";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";

const DEFAULT_SUBMIT_LABEL_KEY = "user_feedback.modal.submit";
const DEFAULT_SUCCESS_TITLE_KEY = "user_feedback.modal.success_title";
const DEFAULT_SUCCESS_MESSAGE_KEY = "user_feedback.modal.success_message";

interface UserFeedbackPageProps {
  titleKey: string;
  subtitleKey: string;
  children: ReactNode;
  isPending: boolean;
  isSuccess: boolean;
  showFooter?: boolean;
  isSubmitDisabled?: boolean;
  errorMessage?: string | null;
  submitLabelKey?: string;
  successTitleKey?: string;
  successMessageKey?: string;
  onClose: () => void;
  onSubmit: () => void;
  onRetry?: () => void;
  onSuccessClose?: () => void;
}

const getPrimaryActionLabel = (
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
  showFooter = true,
  isSubmitDisabled = false,
  errorMessage,
  submitLabelKey = DEFAULT_SUBMIT_LABEL_KEY,
  successTitleKey = DEFAULT_SUCCESS_TITLE_KEY,
  successMessageKey = DEFAULT_SUCCESS_MESSAGE_KEY,
  onClose,
  onSubmit,
  onRetry,
  onSuccessClose,
}: UserFeedbackPageProps): ReactElement => {
  const { t } = useTranslation("common");
  const closeHandler = isSuccess ? (onSuccessClose ?? onClose) : onClose;
  const primaryActionLabel = getPrimaryActionLabel(
    isPending,
    errorMessage,
    t(submitLabelKey),
    t("user_feedback.modal.loading"),
    t("user_feedback.modal.retry"),
  );
  const primaryAction =
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
      <View className="flex-row items-start justify-between border-b border-background-200 px-6 py-4">
        <View className="flex-1 pr-4">
          <CustomText type="title">{t(titleKey)}</CustomText>
          <CustomText className="mt-2 text-base text-typography-600">
            {t(subtitleKey)}
          </CustomText>
        </View>

        <Pressable
          accessibilityLabel={t("user_feedback.modal.close")}
          accessibilityRole="button"
          disabled={isPending}
          hitSlop={12}
          onPress={closeHandler}
        >
          <CloseIcon />
        </Pressable>
      </View>

      {isSuccess ? (
        <>
          <View className="flex-1 items-center justify-center px-6">
            <CustomText type="title" className="text-center">
              {t(successTitleKey)}
            </CustomText>
            <CustomText className="mt-4 text-center text-base text-typography-600">
              {t(successMessageKey)}
            </CustomText>
          </View>

          <View className="border-t border-background-200 px-6 py-4">
            <Button action="submit" onPress={closeHandler}>
              <ButtonText>{t("user_feedback.modal.close")}</ButtonText>
            </Button>
          </View>
        </>
      ) : (
        <>
          <KeyboardAwareScrollView
            bottomOffset={100}
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            disableScrollOnKeyboardHide
          >
            <View className="gap-4 p-6">
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

          {showFooter ? (
            <View className="gap-3 border-t border-background-200 px-6 py-4">
              <Button
                action="secondary"
                isDisabled={isPending}
                onPress={onClose}
              >
                <ButtonText>{t("user_feedback.modal.cancel")}</ButtonText>
              </Button>

              <Button
                action="submit"
                isDisabled={isPending || isSubmitDisabled}
                onPress={primaryAction}
              >
                <ButtonText>{primaryActionLabel}</ButtonText>
              </Button>
            </View>
          ) : null}
        </>
      )}
    </CustomScreenContainer>
  );
};

UserFeedbackPage.displayName = "UserFeedbackPage";
