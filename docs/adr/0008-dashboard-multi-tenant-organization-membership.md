# Dashboard multi-tenant : Organization + Membership + Boundary Scope

Le Dashboard adopte un modèle multi-tenant basé sur **Organization** (tenant générique caractérisé par un `business_type`), **Membership** (relation N:M entre **Dashboard User** et **Organization**) et **Boundary Scope** (relation séparée pour le périmètre géographique restreint). Le concept initial de **Tourism Office** (tenant défini par son périmètre géo) est retiré.

## Considered Options

- **(a) Tourism Office défini par son périmètre géographique** (proposition initiale, cf. `CONTEXT.md` antérieur) : un **Dashboard User** appartient à exactement 1 **Tourism Office** qui possède N **Boundaries** de niveau `CITY`. Cardinalité user → tenant 1:1, scoping géo couplé au tenant.
- **(b) Organization tenant générique + Membership N:M + Boundary Scope relation séparée** — retenu.
- **(c) Organization + Boundary Scope intégré dans la table Organization** (colonne `geographic_scope`) sans table de jointure : incompatible avec la cardinalité « 1 org → N boundaries ».

## Why (b)

1. **Le staff doit pouvoir intervenir temporairement chez un client** sans bypass. Sa modélisation propre est un membership additionnel, ce qui impose la cardinalité N:M user ↔ org.
2. **Tous les tenants n'auront pas un périmètre géographique** : l'org interne `staff` voit tout (`scope_mode='ALL'`), et de futurs profils non-géolocalisables (chaînes hôtelières, transporteurs) pourront exister. Dissocier le scoping géo du tenant lui-même permet cette extension sans refactor.
3. **Extensibilité des types de tenants** : `business_type` (`staff`, `tourist_office`, …) ouvre la porte à de nouveaux profils sans modèle parallèle. Le typage `varchar` plutôt que `pgEnum` (cf. ADR 0006) est appliqué au `business_type` et au `scope_mode` pour éviter les migrations à chaque nouvelle valeur.

## Conséquences

- **4 tables fondations** dans la migration `0024` réécrite : `dashboard_users` (corrigée, sans `role`), `dashboard_organizations`, `dashboard_memberships`, `dashboard_organization_boundaries`. Toutes préfixées `dashboard_`.
- **Pas de RBAC intra-org en V0** : tous les memberships d'une org confèrent les mêmes droits. Une colonne `role` sur `memberships` sera ajoutée si on a besoin de séparer admin/viewer dans une même org cliente.
- **L'application du Boundary Scope** est portée par le middleware tenant, pas par les contrôleurs (cf. ADR 0009). L'org `staff` (`scope_mode='ALL'`) shortcut le filtre ; les orgs `BOUNDARIES` filtrent leurs requêtes SQL via les `boundary_ids` chargés en contexte.
- **Pas de FK sur `dashboard_organization_boundaries.boundary_id`** : le `data-manager` fait du `DELETE + INSERT` sur les boundaries lors des re-imports OSM ; on tolère des liens orphelins temporaires que le JOIN au middleware ignore naturellement.
- **Le concept `Dashboard Role` sur `dashboard_users`** (cf. ADR 0006) devient obsolète : la sémantique est déplacée sur `Organization.business_type`. La colonne `dashboard_users.role` est supprimée dans la migration `0024` réécrite. L'ADR 0006 reste pertinent comme précédent pour le pattern `varchar` typé, désormais appliqué à `business_type` et `scope_mode`.
- **Provisioning initial** : pas de migration de seed ni de script CLI en V0. L'org `staff` et les memberships initiaux sont insérés manuellement en SQL.
