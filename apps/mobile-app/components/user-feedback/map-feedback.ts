import { type CreateUserFeedbackInput } from "@/hooks/mutations/useCreateUserFeedback";

export type MapFeedbackType =
  | "bug"
  | "poi_report"
  | "suggestion"
  | "incomprehension"
  | "other";

export interface MapFeedbackOption {
  value: MapFeedbackType;
  labelKey: string;
  placeholderKey: string;
}

export const MAP_FEEDBACK_OPTIONS: MapFeedbackOption[] = [
  {
    value: "bug",
    labelKey: "user_feedback.map.modal.type_options.bug",
    placeholderKey: "user_feedback.map.modal.placeholders.bug",
  },
  {
    value: "poi_report",
    labelKey: "user_feedback.map.modal.type_options.poi_report",
    placeholderKey: "user_feedback.map.modal.placeholders.poi_report",
  },
  {
    value: "suggestion",
    labelKey: "user_feedback.map.modal.type_options.suggestion",
    placeholderKey: "user_feedback.map.modal.placeholders.suggestion",
  },
  {
    value: "incomprehension",
    labelKey: "user_feedback.map.modal.type_options.incomprehension",
    placeholderKey: "user_feedback.map.modal.placeholders.incomprehension",
  },
  {
    value: "other",
    labelKey: "user_feedback.map.modal.type_options.other",
    placeholderKey: "user_feedback.map.modal.placeholders.other",
  },
];

export const MAP_FEEDBACK_MIN_MESSAGE_LENGTH = 10;
export const MAP_FEEDBACK_MAX_MESSAGE_LENGTH = 1000;

export const buildMapFeedbackInput = (
  feedbackType: MapFeedbackType,
  message: string,
  city?: string | null,
): CreateUserFeedbackInput => {
  switch (feedbackType) {
    case "bug":
      return {
        category: "BUG",
        city: city ?? undefined,
        message,
        payload: {
          screen: "MAP",
        },
      };
    case "poi_report":
      return {
        category: "POI_REPORT",
        city: city ?? undefined,
        message,
        payload: {
          reason: "OTHER",
          source: "MAP",
        },
      };
    case "suggestion":
      return {
        category: "SUGGESTION",
        city: city ?? undefined,
        message,
        payload: {
          topic: "MAP",
        },
      };
    case "incomprehension":
      return {
        category: "INCOMPREHENSION",
        city: city ?? undefined,
        message,
        payload: {
          feature: "MAP",
        },
      };
    case "other":
      return {
        category: "OTHER",
        city: city ?? undefined,
        message,
        payload: {
          context: "MAP",
        },
      };
  }
};
