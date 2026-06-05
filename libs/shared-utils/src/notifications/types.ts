import { type NotificationTemplateKey } from "./template-keys.js";

export const NOTIFICATION_CHANNEL_IDS = [
  "activity_progression",
  "proximity",
  "inactivity",
] as const;
export type NotificationChannelId = (typeof NOTIFICATION_CHANNEL_IDS)[number];

export const NOTIFICATION_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export type NotificationTriggerSource =
  | "cron:first_place_prompt"
  | "cron:inactive_2d"
  | "cron:inactive_7d";

export interface NotificationTemplateVariant {
  title: string;
  body: string;
}

export interface NotificationTemplate {
  key: NotificationTemplateKey;
  channelId: NotificationChannelId;
  priority: NotificationPriority;
  // null = unique en vie (jamais ré-envoyé), > 0 = nb d'heures de cooldown
  cooldownHours: number | null;
  deepLink: string;
  requiredVariables: readonly string[];
  triggerSource: NotificationTriggerSource;
  variants: readonly NotificationTemplateVariant[];
  // Nom de l'event Firebase Analytics tracké à l'ouverture (informatif, pas utilisé côté code)
  kpiEvent: string;
}

export interface RenderedTemplate {
  title: string;
  body: string;
  deepLink: string;
  channelId: NotificationChannelId;
  priority: NotificationPriority;
}
