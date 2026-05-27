# `dashboard_users.role` : `varchar` typé plutôt que `pgEnum`

Le champ `role` de `dashboard_users` est un `varchar({ length: 100 }).$type<DashboardRole>()`, pas un `pgEnum`. La validation des valeurs autorisées vit au niveau TypeScript (union type) et au boundary de l'API (TypeBox), pas en DB.

## Considered Options

- **`pgEnum("DashboardRoleEnum", [...])`**, cohérent avec `roleEnum`, `boundaryLevelEnum`, `poiDataSourceEnum`, etc.
- **`varchar` typé via `.$type<DashboardRole>()`** — retenu.

## Why

- **Phase 2 (B2B) imposera des ajouts répétés de rôles** (`B2B_OFFICE_MANAGER`, `B2B_OFFICE_VIEWER`, futurs niveaux…). Un `pgEnum` exige une migration Postgres (`ALTER TYPE … ADD VALUE`) à chaque ajout — pénible et bloquant en revue.
- **Précédent dans le schéma** : `user_feedbacks.category` utilise déjà ce pattern (`varchar({ length: 100 }).$type<UserFeedbackCategory>()`, schema.ts:428). On reste cohérent avec une convention existante du repo, juste minoritaire.
- **La safety n'est pas perdue, elle est déplacée** : `DashboardRole` est une union TypeScript exhaustive, et les payloads d'écriture sont validés par TypeBox côté API. Une valeur inattendue ne peut pas entrer.

## Consequences

- Une typo non-bloquée par la DB peut entrer si elle contourne l'API (ex : modification manuelle SQL). Acceptable : la DB n'est pas le seul rempart.
- Pas de listing automatique des valeurs autorisées en DB pour un outil externe (BI, etc.). Si un jour ça devient un besoin, on pourra ajouter un `CHECK` constraint plus tard sans refactor du code applicatif.
