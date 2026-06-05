// Limite de candidats traités par tick de cron. Au-delà, le worker log un
// warn pour signaler qu'on devrait passer en fanout job-per-user (V1).
export const NOTIFICATION_CRON_BATCH_LIMIT = 1000;

// V0 timezone hardcodée (cf. `USER_TIMEZONE` côté dispatch). Les crons batch
// sont planifiés dans ce fuseau pour que les horaires métier (10h/11h/12h)
// soient lus en heure locale plutôt qu'en UTC.
export const NOTIFICATION_CRON_TZ = "Europe/Paris";
