import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";

import { type PlaceReportOptionId, REPORT_OPTIONS } from "./constants";
import { OptionChip } from "./OptionChip";

interface ReasonStepProps {
  selectedReportType: PlaceReportOptionId | null;
  onSelectReportType: (value: PlaceReportOptionId) => void;
}

export const ReasonStep = ({
  selectedReportType,
  onSelectReportType,
}: ReasonStepProps): ReactElement => {
  const { t } = useTranslation("common");

  return (
    <>
      <View className="gap-3">
        <CustomText className="text-sm font-semibold text-typography-900">
          {t("user_feedback.place_details.modal.question_reason")}
        </CustomText>
        {REPORT_OPTIONS.map((option) => {
          return (
            <OptionChip
              key={option.value}
              label={t(option.labelKey)}
              isSelected={selectedReportType === option.value}
              onPress={() => {
                onSelectReportType(option.value);
              }}
            />
          );
        })}
      </View>
    </>
  );
};

ReasonStep.displayName = "ReasonStep";
