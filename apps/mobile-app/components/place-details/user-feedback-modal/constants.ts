import { type UserFeedbackPoiReportReason } from "@vagabond/shared-utils";

export type PlaceReportOptionId =
  | "incorrect_info"
  | "closed_or_missing"
  | "irrelevant_place"
  | "wrong_category"
  | "accessibility_issue"
  | "wrong_photos"
  | "missing_information"
  | "other_remark";

export type PlaceInformationOptionId =
  | "category"
  | "photos"
  | "fun_facts"
  | "description"
  | "address"
  | "phone"
  | "website"
  | "price"
  | "opening_hours"
  | "practical_information"
  | "accessibility"
  | "transport_access";

export type WizardStep = "reason" | "information" | "comment";

export interface SelectionOption<TValue extends string> {
  value: TValue;
  labelKey: string;
}

export interface ReportOption extends SelectionOption<PlaceReportOptionId> {
  reason: UserFeedbackPoiReportReason;
}

export const REPORT_OPTIONS: ReportOption[] = [
  {
    value: "incorrect_info",
    labelKey: "user_feedback.place_details.modal.report_options.incorrect_info",
    reason: "DATA_ISSUE",
  },
  {
    value: "closed_or_missing",
    labelKey:
      "user_feedback.place_details.modal.report_options.closed_or_missing",
    reason: "CLOSED",
  },
  {
    value: "irrelevant_place",
    labelKey:
      "user_feedback.place_details.modal.report_options.irrelevant_place",
    reason: "INAPPROPRIATE_CONTENT",
  },
  {
    value: "wrong_category",
    labelKey: "user_feedback.place_details.modal.report_options.wrong_category",
    reason: "DATA_ISSUE",
  },
  {
    value: "accessibility_issue",
    labelKey:
      "user_feedback.place_details.modal.report_options.accessibility_issue",
    reason: "DATA_ISSUE",
  },
  {
    value: "wrong_photos",
    labelKey: "user_feedback.place_details.modal.report_options.wrong_photos",
    reason: "DATA_ISSUE",
  },
  {
    value: "missing_information",
    labelKey:
      "user_feedback.place_details.modal.report_options.missing_information",
    reason: "DATA_ISSUE",
  },
  {
    value: "other_remark",
    labelKey: "user_feedback.place_details.modal.report_options.other_remark",
    reason: "OTHER",
  },
];

export const INFORMATION_OPTIONS: Array<
  SelectionOption<PlaceInformationOptionId>
> = [
  {
    value: "category",
    labelKey: "user_feedback.place_details.modal.information_options.category",
  },
  {
    value: "photos",
    labelKey: "user_feedback.place_details.modal.information_options.photos",
  },
  {
    value: "fun_facts",
    labelKey: "user_feedback.place_details.modal.information_options.fun_facts",
  },
  {
    value: "description",
    labelKey:
      "user_feedback.place_details.modal.information_options.description",
  },
  {
    value: "practical_information",
    labelKey:
      "user_feedback.place_details.modal.information_options.practical_information",
  },
  {
    value: "accessibility",
    labelKey:
      "user_feedback.place_details.modal.information_options.accessibility",
  },
  {
    value: "transport_access",
    labelKey:
      "user_feedback.place_details.modal.information_options.transport_access",
  },
];

export const GENERAL_INFORMATION_OPTIONS: Array<
  SelectionOption<PlaceInformationOptionId>
> = [
  {
    value: "address",
    labelKey: "user_feedback.place_details.modal.information_options.address",
  },
  {
    value: "phone",
    labelKey: "user_feedback.place_details.modal.information_options.phone",
  },
  {
    value: "website",
    labelKey: "user_feedback.place_details.modal.information_options.website",
  },
  {
    value: "price",
    labelKey: "user_feedback.place_details.modal.information_options.price",
  },
  {
    value: "opening_hours",
    labelKey:
      "user_feedback.place_details.modal.information_options.opening_hours",
  },
];
