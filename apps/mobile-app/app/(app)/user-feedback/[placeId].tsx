import { router, useLocalSearchParams } from "expo-router";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { CommentStep } from "@/components/place-details/user-feedback-modal/CommentStep";
import {
  type PlaceInformationOptionId,
  type PlaceReportOptionId,
  REPORT_OPTIONS,
  type WizardStep,
} from "@/components/place-details/user-feedback-modal/constants";
import { InformationStep } from "@/components/place-details/user-feedback-modal/InformationStep";
import { ReasonStep } from "@/components/place-details/user-feedback-modal/ReasonStep";
import {
  buildFeedbackMessage,
  buildFeedbackSource,
} from "@/components/place-details/user-feedback-modal/utils";
import { UserFeedbackPage } from "@/components/user-feedback/UserFeedbackPage";
import { useCreateUserFeedback } from "@/hooks/mutations/useCreateUserFeedback";
import { trackEvent } from "@/lib/analytics/analytics";

const getPlaceIdParam = (
  placeId: string | string[] | undefined,
): string | null => {
  const normalizedPlaceId = Array.isArray(placeId) ? placeId[0] : placeId;

  if (normalizedPlaceId === undefined) {
    return null;
  }

  const trimmedPlaceId = normalizedPlaceId.trim();

  return trimmedPlaceId === "" ? null : trimmedPlaceId;
};

export default function UserFeedbackRoute(): ReactElement | null {
  const { placeId } = useLocalSearchParams<{ placeId?: string | string[] }>();
  const normalizedPlaceId = getPlaceIdParam(placeId);
  const { t } = useTranslation("common");
  const mutation = useCreateUserFeedback();
  const [message, setMessage] = useState<string>("");
  const [selectedReportType, setSelectedReportType] =
    useState<PlaceReportOptionId | null>(null);
  const [selectedInformationType, setSelectedInformationType] =
    useState<PlaceInformationOptionId | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>("reason");

  useEffect(() => {
    if (normalizedPlaceId === null) {
      router.dismiss();
      return;
    }
    void trackEvent("poi_report_started", { poi_id: normalizedPlaceId });
  }, [normalizedPlaceId]);

  const { isError: mutationHasError, reset: resetMutation } = mutation;
  const mutationHasErrorRef = useRef(mutationHasError); // need to use a ref to be react compiler compatible

  useEffect(() => {
    mutationHasErrorRef.current = mutationHasError;
  }, [mutationHasError]);

  useEffect(() => {
    if (mutationHasErrorRef.current) {
      resetMutation();
    }
  }, [
    resetMutation,
    selectedReportType,
    selectedInformationType,
    message,
    currentStep,
  ]);

  if (normalizedPlaceId === null) {
    return null;
  }

  const trimmedMessage = message.trim();
  const selectedReportOption =
    selectedReportType === null
      ? null
      : (REPORT_OPTIONS.find((option) => option.value === selectedReportType) ??
        null);
  const informationOptionLabelKey = `user_feedback.place_details.modal.information_options.${selectedInformationType}`;
  const selectedInformationLabel =
    selectedInformationType === null ? null : t(informationOptionLabelKey);
  const requiresInformationStep = selectedReportType === "incorrect_info";
  const isSubmitDisabled =
    selectedReportType === null ||
    (requiresInformationStep && selectedInformationType === null);

  const handleClose = (): void => {
    router.back();
  };

  const handleSubmit = (): void => {
    if (
      selectedReportOption === null ||
      (requiresInformationStep && selectedInformationLabel === null)
    ) {
      return;
    }

    void trackEvent("poi_report_submitted", {
      poi_id: normalizedPlaceId,
    });

    mutation.mutate({
      category: "POI_REPORT",
      message: buildFeedbackMessage({
        reportTypeLabel: t(selectedReportOption.labelKey),
        informationTypeLabel: selectedInformationLabel,
        comment: trimmedMessage,
      }),
      targetPoiId: normalizedPlaceId,
      payload: {
        reason: selectedReportOption.reason,
        source: buildFeedbackSource(
          selectedReportOption.value,
          selectedInformationType,
        ),
      },
    });
  };

  const handleBack = (): void => {
    if (currentStep === "information") {
      setCurrentStep("reason");
      return;
    }

    if (currentStep === "comment") {
      setCurrentStep(requiresInformationStep ? "information" : "reason");
    }
  };

  const handleSelectReportType = (value: PlaceReportOptionId): void => {
    setSelectedReportType(value);
    setSelectedInformationType(null);
    setCurrentStep(value === "incorrect_info" ? "information" : "comment");
  };

  const handleSelectInformationType = (
    value: PlaceInformationOptionId,
  ): void => {
    setSelectedInformationType(value);
    setCurrentStep("comment");
  };

  const renderCurrentStep = (): ReactElement => {
    if (currentStep === "reason") {
      return (
        <ReasonStep
          selectedReportType={selectedReportType}
          onSelectReportType={handleSelectReportType}
        />
      );
    }

    if (currentStep === "information") {
      return (
        <InformationStep
          selectedInformationType={selectedInformationType}
          onSelectInformationType={handleSelectInformationType}
          onBack={handleBack}
        />
      );
    }

    return (
      <CommentStep
        message={message}
        onChangeMessage={setMessage}
        onBack={handleBack}
      />
    );
  };

  return (
    <UserFeedbackPage
      titleKey="user_feedback.place_details.modal.title"
      subtitleKey="user_feedback.place_details.modal.subtitle"
      submitLabelKey="user_feedback.place_details.modal.submit"
      successTitleKey="user_feedback.place_details.modal.success_title"
      successMessageKey="user_feedback.place_details.modal.success_message"
      isPending={mutation.isPending}
      isSuccess={mutation.isSuccess}
      showFooter={currentStep === "comment"}
      isSubmitDisabled={isSubmitDisabled}
      errorMessage={mutation.error?.message}
      onClose={handleClose}
      onSubmit={handleSubmit}
      onRetry={handleSubmit}
      onSuccessClose={handleClose}
    >
      {renderCurrentStep()}
    </UserFeedbackPage>
  );
}
