# Notifications push — règles V0

Documentation des 3 templates de notification livrés en V0 (VG-210), leurs
déclencheurs, conditions d'éligibilité et garde-fous anti-spam. Toutes les
constantes mentionnées sont dans `libs/shared-utils/src/notifications/`.

## Pipeline d'envoi

```
┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  ┌────────────────┐  ┌─────┐
│ Trigger cron │→ │ SELECT SQL    │→ │ Dispatcher       │→ │ Sender + FCM   │→ │ App │
│ (pg-boss)    │  │ candidats     │  │ + Orchestrateur  │  │ + écriture     │  │     │
└──────────────┘  └───────────────┘  │ (anti-spam)      │  │ notif_events   │  └─────┘
                                     └──────────────────┘  └────────────────┘
```

- **SELECT candidats** : `NotificationCandidateRepository` filtre les users
  éligibles (push device actif + critère métier propre à chaque template).
- **Orchestrateur** : `selectNextNotification` applique les filtres anti-spam
  globaux puis ceux par template, et choisit le candidat le mieux scoré.
- **Sender** : rend le template, écrit une ligne `notification_events`, fanout
  FCM, nettoie les tokens morts.

Une notification rejetée par l'orchestrateur est loguée mais **pas écrite**
dans `notification_events` (donc invisible à l'utilisateur et au compte
anti-spam).

---

## Garde-fous globaux (orchestrateur)

Appliqués à tout candidat, dans l'ordre suivant ; le premier qui échoue
remonte une raison de rejet déterministe pour les logs.

| Règle           | Constante                               | Valeur V0                   | Sémantique                                                   |
| --------------- | --------------------------------------- | --------------------------- | ------------------------------------------------------------ |
| Cap journalier  | `MAX_PUSH_PER_DAY`                      | **1**                       | Max 1 push effectif / 24 h glissantes                        |
| Cap hebdo       | `MAX_PUSH_PER_WEEK`                     | **4**                       | Max 4 push effectifs / 7 j glissants                         |
| Quiet hours     | `QUIET_HOURS_START` → `QUIET_HOURS_END` | **22h → 7h** (Europe/Paris) | Aucun push entre 22h et 7h heure locale                      |
| Min gap         | `MIN_HOURS_BETWEEN_PUSH`                | **6 h**                     | Au moins 6 h entre deux push, tous templates confondus       |
| Session récente | `RECENT_SESSION_HOURS`                  | **2 h**                     | Bloque les MEDIUM/LOW si user actif < 2 h. HIGH passe outre. |

> `lastSessionAt` n'est **pas encore branché** en V0 ; le filtre session
> récente est donc effectivement neutralisé en attendant une source fiable
> (cf. TODO `dispatch.ts`).

### Anti-spam : ce qui est compté

Les méthodes anti-spam ignorent :

- Les events `status = "failed"` (échec FCM) — ne consomment pas le quota.

### Timezone

La timezone utilisateur est **hardcodée `Europe/Paris`** en V0 (`USER_TIMEZONE`
dans `dispatch.ts`). Les crons batch sont schedulés avec
`tz: NOTIFICATION_CRON_TZ = "Europe/Paris"`.

---

## Template `first_place_prompt`

Inciter les nouveaux utilisateurs à valider leur premier lieu.

| Paramètre          | Valeur                                                            |
| ------------------ | ----------------------------------------------------------------- |
| Trigger            | Cron `0 11 * * *` Europe/Paris (1× / jour à 11h Paris)            |
| Worker             | `apps/api/src/workers/notifications/first-place-prompt.worker.ts` |
| Priorité           | **HIGH**                                                          |
| Channel Android    | `activity_progression`                                            |
| APNs priority      | 10 (immédiat)                                                     |
| Cooldown           | 48 h (entre deux envois `first_place_prompt`)                     |
| Variants           | 5 titres alternés via `variantIndex`                              |
| Variables requises | aucune                                                            |
| Deep link          | `vagabond://(app)/(tabs)` (home)                                  |
| KPI ouverture      | `first_validation`                                                |

### SQL d'éligibilité (`findFirstPlacePromptCandidates`)

- `users.created_at <= now() - 24 h`
- `NOT EXISTS (visited_pois WHERE user_id = users.user_id)` — zéro POI validé.
- `EXISTS (push_devices WHERE user_id = users.user_id AND disabled_at IS NULL)`
- `ORDER BY user_id ASC LIMIT 1000` (`NOTIFICATION_CRON_BATCH_LIMIT`).

### Cohorte

Mutuellement exclusive avec `inactive_2d` / `inactive_7d` (qui exigent au
moins un POI validé).

---

## Template `inactive_2d`

Relancer les utilisateurs qui ont commencé à valider des lieux mais qui sont
inactifs depuis 2 à 7 jours.

| Paramètre          | Valeur                                                     |
| ------------------ | ---------------------------------------------------------- |
| Trigger            | Cron `0 10 * * *` Europe/Paris (1× / jour à 10h Paris)     |
| Worker             | `apps/api/src/workers/notifications/inactive-2d.worker.ts` |
| Priorité           | **MEDIUM**                                                 |
| Channel Android    | `inactivity`                                               |
| APNs priority      | 5 (power-aware)                                            |
| Cooldown           | 168 h (7 jours)                                            |
| Variants           | 5                                                          |
| Variables requises | aucune                                                     |
| Deep link          | home                                                       |
| KPI ouverture      | `reopen`                                                   |

### SQL d'éligibilité (`findInactive2dCandidates`)

- `MAX(visited_pois.created_at) BETWEEN now() - 7 j AND now() - 2 j`
- `EXISTS (push_devices WHERE user_id = users.user_id AND disabled_at IS NULL)`
- `ORDER BY user_id ASC LIMIT 1000`.

---

## Template `inactive_7d`

Relancer les utilisateurs absents depuis ≥ 7 jours.

| Paramètre          | Valeur                                                     |
| ------------------ | ---------------------------------------------------------- |
| Trigger            | Cron `0 12 * * *` Europe/Paris (1× / jour à 12h Paris)     |
| Worker             | `apps/api/src/workers/notifications/inactive-7d.worker.ts` |
| Priorité           | **HIGH**                                                   |
| Channel Android    | `inactivity`                                               |
| APNs priority      | 10 (immédiat)                                              |
| Cooldown           | 168 h (7 jours)                                            |
| Variants           | 5                                                          |
| Variables requises | aucune                                                     |
| Deep link          | home                                                       |
| KPI ouverture      | `reopen`                                                   |

### SQL d'éligibilité (`findInactive7dCandidates`)

- `MAX(visited_pois.created_at) < now() - 7 j`
- `EXISTS (push_devices WHERE user_id = users.user_id AND disabled_at IS NULL)`
- `ORDER BY user_id ASC LIMIT 1000`.

> La priorité est **HIGH** (et non MEDIUM comme `inactive_2d`) : un user
> silencieux depuis 1 semaine est plus susceptible de churn, on accepte de
> contourner le filtre `RECENT_SESSION` si jamais il rouvre l'app peu avant.

---

## Variantes & rendu

Chaque template expose 5 variants `{ title, body }`. Le `variantIndex` est
calculé par `countSentForTemplate(userId, templateKey)` (événements `failed`
compris) puis mappé via `variantIndex % variants.length`. Garantit une rotation
déterministe et reproductible entre re-sends.

Le rendu (`renderTemplate`) interpole les variables `{nom}` du template. Aucun
template V0 ne déclare de variable requise (`requiredVariables: []`) ; la garde
reste en place pour de futurs templates. Si une variable requise est manquante,
le sender écrit un event `status = "failed"` avec
`failureReason = "render_failed"`, remonte Sentry, et n'envoie rien.

---

## Stockage : `notification_events`

| Colonne                            | Note                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notification_id`                  | UUID v4, unique. Sert d'identifiant côté FCM data payload pour le tracking d'ouverture.                                                                       |
| `template_key`                     | Clé de `NOTIFICATION_TEMPLATES`.                                                                                                                              |
| `channel_id`                       | Android notification channel id (`activity_progression`, `inactivity`).                                                                                       |
| `priority`                         | Recopiée du template.                                                                                                                                         |
| `title_rendered` / `body_rendered` | Variant rendu (vide si `render_failed`).                                                                                                                      |
| `variant_index`                    | Index utilisé.                                                                                                                                                |
| `deep_link`                        | URL au clic (V0 : toujours home).                                                                                                                             |
| `status`                           | `sent` (au moins 1 device reçu) / `failed` (tous les devices ont échoué OU render_failed OU pas de device) / `opened` (transition idempotente à l'ouverture). |
| `failure_reason`                   | Liste de codes FCM joints ou raison sentinelle (`no_active_devices`, `render_failed`).                                                                        |
| `sent_at`                          | Timestamp d'écriture.                                                                                                                                         |
| `opened_at`                        | Mis à jour une seule fois quand l'app reçoit le `notificationId` au clic.                                                                                     |
| `trigger_source`                   | Cf. `NotificationTriggerSource` : `cron:first_place_prompt`, `cron:inactive_2d`, `cron:inactive_7d`.                                                          |
| `trigger_coords`                   | Point geometry. Réservé aux triggers géolocalisés (aucun en V0) ; toujours `NULL` actuellement.                                                               |

Index spatial GIST sur `trigger_coords` conservé comme point d'extension pour
de futurs triggers géolocalisés (aucun lecteur en V0).

---

## Hors scope V0 (à savoir)

- Multi-timezone utilisateur (V0 : Paris hardcodé).
- Heartbeat de session pour brancher `lastSessionAt`.
- Tests d'intégration automatisés (V0 : tests manuels uniquement).
- Notifications Android `body` souvent vide — l'UX mobile peut afficher
  seulement le `title`. À raffiner via wording dans une itération dédiée.
- Quand un cron atteint `NOTIFICATION_CRON_BATCH_LIMIT = 1000` candidats, un
  warn est logué : signal pour passer en fanout job-per-user en V1.
