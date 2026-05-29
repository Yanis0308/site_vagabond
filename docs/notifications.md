# Notifications push — règles V0

Documentation des 4 templates de notification livrés en V0 (VG-210), leurs
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
- Les events `triggerSource = "system:placeholder"` — voir [placeholder
  anti-1ère-fois](#placeholder-anti-1ère-fois) ci-dessous.

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

## Template `entered_city`

Saluer un utilisateur qui s'installe dans une nouvelle ville.

| Paramètre          | Valeur                                                      |
| ------------------ | ----------------------------------------------------------- |
| Trigger            | Cron `*/15 * * * *` UTC (toutes les 15 min)                 |
| Worker             | `apps/api/src/workers/notifications/entered-city.worker.ts` |
| Priorité           | **HIGH**                                                    |
| Channel Android    | `proximity`                                                 |
| APNs priority      | 10 (immédiat)                                               |
| Cooldown           | 24 h                                                        |
| Variants           | 5                                                           |
| Variables requises | `ville`                                                     |
| Deep link          | home                                                        |
| KPI ouverture      | `city_session`                                              |

### Conditions cumulatives

1. **Stabilité géographique** (`findEnteredCityCandidates`)
   - ≥ `STABILITY_MIN_PINGS = 3` pings `user_locations` dans la fenêtre
     `STABILITY_WINDOW_MINUTES = 15` min.
   - Tous les pings à moins de `STABILITY_RADIUS_M = 500` m du **centroïde**
     calculé (`MAX(ST_Distance(coords::geography, centroid::geography))`).
2. **Push device actif** : `EXISTS push_devices WHERE disabled_at IS NULL`.
3. **Reverse-geocoding KNN** sur `boundaries`
   - `boundary_level = 'CITY'` exclusivement.
   - `name IS NOT NULL`.
   - Cap à `KNN_MAX_DISTANCE_M = 30 000` m. Hors cap, skip silencieux (un user
     en pleine campagne ne reçoit pas la notif).
4. **Dédup distance** (applicatif, Haversine TS)
   - Compare le `display_point` de la CITY matchée au `triggerCoords` du
     dernier event `entered_city` (toutes lignes confondues, y compris les
     placeholders — cf. ci-dessous).
   - Bloque si distance ≤ `ENTERED_CITY_DEDUP_RADIUS_M = 100` m.
   - Sémantique : "déjà notifié pour cette ville". 100 m est un seuil
     extrêmement serré ; comme on stocke le `display_point` (point unique par
     boundary, pas la position du user), cela vaut "même CITY".

### Latence

Latence max ≈ `STABILITY_WINDOW + CRON_TICK = 30 min` entre l'arrivée et la
notification.

### Le user reçoit la notif quand

- Il s'installe stable dans une nouvelle CITY mappée à ≤ 30 km, **et**
- son dernier `entered_city` (réel ou placeholder) est dans une autre CITY
  (display_point > 100 m), **et**
- l'orchestrateur ne le rejette pas (cooldown 24 h, quiet hours, caps, etc.).

---

## Placeholder anti-1ʳᵉ-fois

### Problème

Sans précaution, un user inscrit à Paris reçoit "Bienvenue à Paris" au 1er
cron `entered_city` qui suit son inscription. Ce n'est pas une _bienvenue_ —
c'est juste sa ville. Mauvais UX.

### Solution

Au **tout premier `POST /location`** d'un user, on insère une ligne
"placeholder" dans `notification_events` :

| Champ                                             | Valeur                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| `templateKey`                                     | `entered_city`                                     |
| `triggerSource`                                   | **`system:placeholder`**                           |
| `triggerCoords`                                   | `display_point` de la CITY KNN-matchée (cap 30 km) |
| `status`                                          | `sent`                                             |
| `sentAt`                                          | `now()`                                            |
| `notificationId`                                  | UUID jetable                                       |
| `titleRendered` / `bodyRendered` / `variantIndex` | sentinelles (`""`, `""`, `0`)                      |

Le placeholder n'est **jamais délivré** à un device — c'est purement un repère
DB pour amorcer la dédup distance.

### Service

`ensureEnteredCityBaseline` dans
`apps/api/src/services/notification-placeholder.service.ts`. Appelé en
_best-effort_ depuis `POST /location` **avant** `insertLocation`. Une erreur du
service n'interrompt pas l'enregistrement du ping.

Étapes :

1. `EXISTS user_locations WHERE user_id = X LIMIT 1` (1 seule query indexée).
2. Si déjà existant → return (pas la 1ʳᵉ).
3. Sinon, `findClosestCity` : KNN sur `boundaries` CITY ≤ 30 km.
4. Match → insert placeholder. Pas de match (rural) → pas de placeholder ;
   l'utilisateur sera notifié naturellement la première fois qu'il atteindra
   une ville mappée.

### Conséquences sur l'anti-spam

Le placeholder serait sinon **compté comme un push consommé** (status `sent`),
ce qui bloquerait toute notif pendant 24 h post-inscription
(`MAX_PUSH_PER_DAY = 1`). On filtre donc explicitement le triggerSource
`system:placeholder` dans 4 méthodes de `NotificationEventRepository` :

| Méthode                     | Comportement                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `countSinceForUser`         | **Exclut** les placeholders (sinon quota = 0 pendant 24 h).                                                                                      |
| `getLastSentAtForUser`      | **Exclut** (sinon `min_gap` bloque 6 h post-signup).                                                                                             |
| `getLastSentAtForTemplate`  | **Exclut** (la dédup distance gère le cooldown du template `entered_city` ; un user qui bouge à Lyon doit recevoir la notif sans attendre 24 h). |
| `countSentForTemplate`      | **Exclut** (sinon le `variantIndex` est décalé).                                                                                                 |
| `getLastEnteredCityTrigger` | **INCLUT** — c'est précisément son rôle pour la dédup.                                                                                           |

---

## Variantes & rendu

Chaque template expose 5 variants `{ title, body }`. Le `variantIndex` est
calculé par `countSentForTemplate(userId, templateKey)` (placeholders exclus,
événements `failed` compris) puis mappé via `variantIndex % variants.length`.
Garantit une rotation déterministe et reproductible entre re-sends.

Le rendu (`renderTemplate`) interpole les variables `{nom}` du template. Si
une variable requise est manquante (cas `entered_city` sans `ville`), le sender
écrit un event `status = "failed"` avec `failureReason = "render_failed"`,
remonte Sentry, et n'envoie rien.

---

## Stockage : `notification_events`

| Colonne                            | Note                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notification_id`                  | UUID v4, unique. Sert d'identifiant côté FCM data payload pour le tracking d'ouverture.                                                                       |
| `template_key`                     | Clé de `NOTIFICATION_TEMPLATES`.                                                                                                                              |
| `channel_id`                       | Android notification channel id (`activity_progression`, `inactivity`, `proximity`).                                                                          |
| `priority`                         | Recopiée du template.                                                                                                                                         |
| `title_rendered` / `body_rendered` | Variant rendu (vide pour placeholders).                                                                                                                       |
| `variant_index`                    | Index utilisé.                                                                                                                                                |
| `deep_link`                        | URL au clic (V0 : toujours home).                                                                                                                             |
| `status`                           | `sent` (au moins 1 device reçu) / `failed` (tous les devices ont échoué OU render_failed OU pas de device) / `opened` (transition idempotente à l'ouverture). |
| `failure_reason`                   | Liste de codes FCM joints ou raison sentinelle (`no_active_devices`, `render_failed`).                                                                        |
| `sent_at`                          | Timestamp d'écriture.                                                                                                                                         |
| `opened_at`                        | Mis à jour une seule fois quand l'app reçoit le `notificationId` au clic.                                                                                     |
| `trigger_source`                   | Cf. `NotificationTriggerSource` : `cron:first_place_prompt`, `cron:inactive_2d`, `cron:inactive_7d`, `cron:entered_city`, `system:placeholder`.               |
| `trigger_coords`                   | Point geometry. Pour `entered_city` : `display_point` de la CITY matchée. Sinon `NULL`.                                                                       |

Index spatial GIST sur `trigger_coords` (utilisé par
`getLastEnteredCityTrigger`).

---

## Hors scope V0 (à savoir)

- Multi-timezone utilisateur (V0 : Paris hardcodé).
- Heartbeat de session pour brancher `lastSessionAt`.
- Tests d'intégration automatisés (V0 : tests manuels uniquement).
- Notifications Android `body` souvent vide — l'UX mobile peut afficher
  seulement le `title`. À raffiner via wording dans une itération dédiée.
- Quand un cron atteint `NOTIFICATION_CRON_BATCH_LIMIT = 1000` candidats, un
  warn est logué : signal pour passer en fanout job-per-user en V1.
- Pas de cascade `NEIGHBORHOOD → DISTRICT → CITY` pour `entered_city` ; un
  user à Belleville reçoit "Bienvenue à Paris".
