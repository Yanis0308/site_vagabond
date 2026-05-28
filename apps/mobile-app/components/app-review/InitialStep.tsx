import { ThumbsDown, ThumbsUp } from "lucide-react-native";
import React, { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Spinner } from "@/components/ui/spinner";

export interface InitialStepProps {
  isPending: boolean;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
}

export const InitialStep = ({
  isPending,
  onThumbsUp,
  onThumbsDown,
}: InitialStepProps): ReactElement => {
  const { t } = useTranslation("common");

  return (
    <>
      <CustomText type="title" className="mb-2 text-center text-typography-900">
        {t("app_review.initial.title")}
      </CustomText>
      <CustomText className="mb-8 text-center text-base text-typography-500">
        {t("app_review.initial.subtitle")}
      </CustomText>

      <View className="flex-row items-center justify-around">
        <Pressable
          onPress={onThumbsDown}
          disabled={isPending}
          className="
            size-16 items-center justify-center rounded-full bg-secondary-50
            active:opacity-70
          "
        >
          <ThumbsDown
            size={32}
            color={themeColors.secondary["600"].hex}
            strokeWidth={1.5}
          />
        </Pressable>

        <Pressable
          onPress={onThumbsUp}
          disabled={isPending}
          className="
            size-16 items-center justify-center rounded-full bg-success-50
            active:opacity-70
          "
        >
          {isPending ? (
            <Spinner color={themeColors.success["600"].hex} />
          ) : (
            <ThumbsUp
              size={32}
              color={themeColors.success["600"].hex}
              strokeWidth={1.5}
            />
          )}
        </Pressable>
      </View>
    </>
  );
};

InitialStep.displayName = "InitialStep";
