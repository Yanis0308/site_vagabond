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
    id: "travel_style",
    options: [
      "backpacker",
      "classic_traveler",
      "local_traveler",
      "digital_nomad",
    ],
  },
  {
    id: "travel_preferences",
    options: ["adventure", "relaxation", "culture", "nightlife"],
  },
  { id: "travel_climate", options: ["hot", "temperate", "cold"] },
  { id: "travel_destination_type", options: ["sea", "mountain", "city"] },
  { id: "travel_food", options: ["important", "medium", "not_important"] },
  { id: "travel_duration", options: ["weekend", "week", "more_than_10_days"] },
  { id: "travel_budget", options: ["small", "medium", "large"] },
  { id: "travel_change_of_scene", options: ["total", "mix", "european"] },
  { id: "travel_music", options: ["electro", "indie", "pop", "lofi", "rap"] },
];
