import React, { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomTextarea } from "@/components/custom-ui/CustomTextarea";
import { Spinner } from "@/components/ui/spinner";

export interface NegativeStepProps {
  isPending: boolean;
  comment: string;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const NegativeStep = ({
  isPending,
  comment,
  onCommentChange,
  onSubmit,
  onBack,
}: NegativeStepProps): ReactElement => {
  const { t } = useTranslation("common");

  return (
    <>
      <CustomText
        type="rating"
        className="mb-2 text-center text-typography-900"
      >
        {t("app_review.negative.title")}
      </CustomText>
      <CustomText className="mb-4 text-center text-base text-typography-500">
        {t("app_review.negative.subtitle")}
      </CustomText>

      <CustomTextarea
        placeholder={t("app_review.negative.placeholder")}
        value={comment}
        onChange={onCommentChange}
        className="mb-4"
      />

      <Pressable
        onPress={onSubmit}
        disabled={isPending}
        className="items-center rounded-2xl bg-primary-600 px-6 py-4 active:opacity-70 disabled:opacity-40"
      >
        {isPending ? (
          <Spinner color="white" />
        ) : (
          <CustomText className="font-semibold text-white">
            {t("app_review.negative.submit")}
          </CustomText>
        )}
      </Pressable>

      <Pressable
        onPress={onBack}
        disabled={isPending}
        className="mt-3 items-center py-2 active:opacity-50 disabled:opacity-40"
      >
        <CustomText className="text-sm text-typography-700">
          {t("app_review.negative.cancel")}
        </CustomText>
      </Pressable>
    </>
  );
};

NegativeStep.displayName = "NegativeStep";
