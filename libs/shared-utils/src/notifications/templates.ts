import { type NotificationTemplateKey } from "./template-keys.js";
import { type NotificationTemplate } from "./types.js";

const HOME_DEEP_LINK = "vagabond://(app)/(tabs)";

// V0 : tous les templates pointent vers la home. Les deep links profonds
// (POI, profil, leaderboard, …) arriveront en V1 avec les nouveaux triggers.
//
// Chaque variant expose `title` + `body` (cf. UX réelle des notifications
// mobiles, qui affichent systématiquement les deux champs). Les `body`
// actuellement vides seront raffinés dans une itération wording dédiée.

export const NOTIFICATION_TEMPLATES = {
  first_place_prompt: {
    key: "first_place_prompt",
    channelId: "activity_progression",
    priority: "HIGH",
    cooldownHours: 48,
    deepLink: HOME_DEEP_LINK,
    requiredVariables: [],
    triggerSource: "cron:first_place_prompt",
    kpiEvent: "first_validation",
    variants: [
      { title: "Ton premier lieu t'attend 👀", body: "" },
      { title: "Il suffit d'un lieu pour commencer l'aventure.", body: "" },
      { title: "Va valider ton premier spot aujourd'hui !", body: "" },
      { title: "Lance ta collection de lieux dès maintenant.", body: "" },
      { title: "Tu n'as encore rien exploré… pour l'instant 😏", body: "" },
    ],
  },
  inactive_2d: {
    key: "inactive_2d",
    channelId: "inactivity",
    priority: "MEDIUM",
    cooldownHours: 7 * 24,
    deepLink: HOME_DEEP_LINK,
    requiredVariables: [],
    triggerSource: "cron:inactive_2d",
    kpiEvent: "reopen",
    variants: [
      { title: "Tu es lancé ! Continue ton exploration 🗺️", body: "" },
      { title: "Reprends ton aventure là où tu t'es arrêté.", body: "" },
      { title: "Cela fait 2 jours, ta carte attend la suite 👀", body: "" },
      { title: "Encore quelques lieux à valider, on continue ?", body: "" },
      { title: "Ta progression t'attend, ne casse pas l'élan 🔥", body: "" },
    ],
  },
  inactive_7d: {
    key: "inactive_7d",
    channelId: "inactivity",
    priority: "HIGH",
    cooldownHours: 7 * 24,
    deepLink: HOME_DEEP_LINK,
    requiredVariables: [],
    triggerSource: "cron:inactive_7d",
    kpiEvent: "reopen",
    variants: [
      { title: "Ça bouge par chez toi… on repart explorer ?", body: "" },
      { title: "Ta carte t'attend 🗺️", body: "" },
      { title: "Il y a sûrement un lieu à découvrir aujourd'hui.", body: "" },
      { title: "Reviens voir ce qu'il reste à explorer.", body: "" },
      { title: "On remet la machine en route ?", body: "" },
    ],
  },
} as const satisfies Record<NotificationTemplateKey, NotificationTemplate>;
