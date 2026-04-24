import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Button, ButtonText } from "@/components/ui/button";

import {
  GENERAL_INFORMATION_OPTIONS,
  INFORMATION_OPTIONS,
  type PlaceInformationOptionId,
} from "./constants";
import { OptionChip } from "./OptionChip";

interface InformationStepProps {
  selectedInformationType: PlaceInformationOptionId | null;
  onSelectInformationType: (value: PlaceInformationOptionId) => void;
  onBack: () => void;
}

export const InformationStep = ({
  selectedInformationType,
  onSelectInformationType,
  onBack,
}: InformationStepProps): ReactElement => {
  const { t } = useTranslation("common");

  return (
    <>
      <View className="gap-3">
        <CustomText className="text-sm font-semibold text-typography-900">
          {t("user_feedback.place_details.modal.question_information")}
        </CustomText>

        {INFORMATION_OPTIONS.map((option) => {
          return (
            <OptionChip
              key={option.value}
              label={t(option.labelKey)}
              isSelected={selectedInformationType === option.value}
              onPress={() => {
                onSelectInformationType(option.value);
              }}
            />
          );
        })}

        <CustomText className="pt-2 text-sm font-semibold text-typography-700">
          {t("user_feedback.place_details.modal.general_information_group")}
        </CustomText>

        {GENERAL_INFORMATION_OPTIONS.map((option) => {
          return (
            <OptionChip
              key={option.value}
              label={t(option.labelKey)}
              isSelected={selectedInformationType === option.value}
              onPress={() => {
                onSelectInformationType(option.value);
              }}
            />
          );
        })}
      </View>

      <Button action="secondary" size="medium" onPress={onBack}>
        <ButtonText>{t("user_feedback.place_details.modal.back")}</ButtonText>
      </Button>
    </>
  );
};

InformationStep.displayName = "InformationStep";
