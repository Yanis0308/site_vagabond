export const NOTIFICATION_TEMPLATE_KEYS = [
  "first_place_prompt",
  "inactive_2d",
  "inactive_7d",
] as const;

export type NotificationTemplateKey =
  (typeof NOTIFICATION_TEMPLATE_KEYS)[number];
