import { logger } from "../utils/logger.js";
import { type NotificationTemplateKey } from "./template-keys.js";
import { NOTIFICATION_TEMPLATES } from "./templates.js";
import { type RenderedTemplate } from "./types.js";

// Match `{varName}` placeholders (alphanumeric + underscore).
const VARIABLE_PATTERN = /\{(\w+)\}/g;

const substitute = (text: string, variables: Record<string, string>): string =>
  text.replace(
    VARIABLE_PATTERN,
    (_match, name: string) => variables[name] ?? "",
  );

/**
 * Resolves a notification template into a ready-to-send payload.
 *
 * - Returns `null` if the template key is unknown.
 * - Returns `null` and logs a warning if a required variable is missing or
 *   empty (defensive: the orchestrateur already filters, this is a second
 *   guard so a bug upstream never produces a broken payload).
 * - Variant is selected via `variantIndex % variants.length` for deterministic
 *   round-robin rotation across re-sends to the same user.
 */
export const renderTemplate = (
  key: NotificationTemplateKey,
  variables: Record<string, string>,
  variantIndex: number,
): RenderedTemplate | null => {
  // Type system guarantees exhaustivity over NotificationTemplateKey.
  // Callers reading a raw string from the DB must narrow first (e.g. via
  // `NOTIFICATION_TEMPLATE_KEYS.includes(value as NotificationTemplateKey)`).
  const template = NOTIFICATION_TEMPLATES[key];

  // Widened to `string[]`: no current template declares required variables, so
  // the const-narrowed element type is `never`. The guard stays generic for
  // future templates that reintroduce `{placeholder}` variables.
  for (const requiredVar of template.requiredVariables as readonly string[]) {
    const value = variables[requiredVar];
    if (value === undefined || value === "") {
      logger.warn(
        `notification_missing_variable: template=${key} variable=${requiredVar}`,
      );
      return null;
    }
  }

  const variant =
    template.variants[
      ((variantIndex % template.variants.length) + template.variants.length) %
        template.variants.length
    ];
  if (variant === undefined) {
    return null;
  }

  return {
    title: substitute(variant.title, variables),
    body: substitute(variant.body, variables),
    deepLink: template.deepLink,
    channelId: template.channelId,
    priority: template.priority,
  };
};
