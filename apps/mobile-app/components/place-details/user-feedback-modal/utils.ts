import {
  type PlaceInformationOptionId,
  type PlaceReportOptionId,
} from "./constants";

export const buildFeedbackSource = (
  reportType: PlaceReportOptionId,
  informationType: PlaceInformationOptionId | null,
): string => {
  return informationType === null
    ? `place_details_sheet:${reportType}`
    : `place_details_sheet:${reportType}:${informationType}`;
};

export const buildFeedbackMessage = ({
  reportTypeLabel,
  informationTypeLabel,
  comment,
}: {
  reportTypeLabel: string;
  informationTypeLabel: string | null;
  comment: string;
}): string => {
  const lines = [`Signalement: ${reportTypeLabel}`];

  if (informationTypeLabel !== null) {
    lines.push(`Information concernée: ${informationTypeLabel}`);
  }

  if (comment !== "") {
    lines.push(`Commentaire: ${comment}`);
  }

  return lines.join("\n");
};
