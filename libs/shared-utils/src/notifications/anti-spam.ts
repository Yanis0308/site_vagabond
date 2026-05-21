// Constantes anti-spam appliquées par l'orchestrateur de notifications.
// Toutes les valeurs sont V0 ; à raffiner via télémétrie une fois en prod.

export const MAX_PUSH_PER_DAY = 1;
export const MAX_PUSH_PER_WEEK = 4;
export const MIN_HOURS_BETWEEN_PUSH = 6;

// Quiet hours en heure locale Europe/Paris (hardcodé V0).
// Plage interprétée comme [START, END) modulo 24h : si START > END, la nuit
// traverse minuit (ex. 22 → 7 = de 22h jusqu'à 6h59 inclus).
export const QUIET_HOURS_START = 22;
export const QUIET_HOURS_END = 7;

// Fenêtre pendant laquelle une session utilisateur est considérée "récente"
// (utilisé pour ne pas pousser une notification à un user déjà actif en app).
export const RECENT_SESSION_HOURS = 2;

// Délai après lequel une notification "sent" sans openedAt est considérée
// comme implicitement ignorée (utile pour des KPI futurs, V1).
export const IGNORED_DETECTION_HOURS = 24;
