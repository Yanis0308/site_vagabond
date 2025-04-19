export interface QuestionType {
  id: string;
  options: string[];
  sendToApi?: boolean;
}

export const questions: QuestionType[] = [
  {
    id: "age",
    options: ["-18", "18-24", "25-34", "35-44", "45+"],
    sendToApi: false,
  },
  {
    id: "gender",
    options: ["male", "female", "other"],
    sendToApi: false,
  },
  {
    id: "travel_mode",
    options: ["solo", "couple", "friends", "family"],
  },
  {
    id: "continent",
    options: [
      "europe",
      "north_america",
      "south_america",
      "africa",
      "asia",
      "all",
    ],
  },
  {
    id: "action_level",
    options: ["max", "high", "medium", "low"],
  },
  {
    id: "nightlife_level",
    options: ["max", "high", "medium", "low"],
  },
  {
    id: "activity_type",
    options: ["landscape", "art", "history", "local"],
  },
  {
    id: "weather",
    options: ["very_hot", "hot", "temperate", "cold"],
  },
  {
    id: "environment",
    options: ["beach", "city", "mountain", "countryside", "desert"],
  },
  {
    id: "food_importance",
    options: ["high", "medium", "low"],
  },
  {
    id: "budget",
    options: ["low", "medium", "high", "very_high"],
  },
  {
    id: "duration",
    options: ["weekend", "week", "two_weeks", "month"],
  },
];
