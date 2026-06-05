import {
  type UserFeedbackCategory,
  type UserFeedbackPayload,
} from "@vagabond/shared-utils";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  foreignKey,
  geometry,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const boundaryLevelEnum = pgEnum("BoundaryLevelEnum", [
  "COUNTRY",
  "REGION",
  "COUNTY",
  "CITY",
  "DISTRICT",
  "NEIGHBORHOOD",
]);
export type BoundaryLevelEnum = (typeof boundaryLevelEnum.enumValues)[number];

export const languageEnum = pgEnum("LanguageEnum", ["EN", "FR"]);
export type LanguageEnum = (typeof languageEnum.enumValues)[number];

export const poiDataSourceEnum = pgEnum("PoiDataSourceEnum", [
  "OSM",
  "AI",
  "CUSTOM",
]);
export type PoiDataSourceEnum = (typeof poiDataSourceEnum.enumValues)[number];

export const poiFilterLevelEnum = pgEnum("PoiFilterLevelEnum", [
  "UNKNOWN",
  "STRICT",
  "STANDARD",
  "INTERMEDIATE",
  "LAXIST",
]);
export type PoiFilterLevelEnum = (typeof poiFilterLevelEnum.enumValues)[number];

export const poiSourceEnum = pgEnum("PoiSourceEnum", ["OSM"]);
export type PoiSourceEnum = (typeof poiSourceEnum.enumValues)[number];

export const roleEnum = pgEnum("RoleEnum", ["ADMIN", "USER"]);
export type RoleEnum = (typeof roleEnum.enumValues)[number];

export const visitedPoiStatus = pgEnum("VisitedPoiStatus", [
  "PENDING",
  "CONFIRMED",
]);
export type VisitedPoiStatusEnum = (typeof visitedPoiStatus.enumValues)[number];

export const processingStatusEnum = pgEnum("ProcessingStatusEnum", [
  "pending",
  "success",
  "error",
]);
export type ProcessingStatusEnum =
  (typeof processingStatusEnum.enumValues)[number];

export const imageSourceEnum = pgEnum("ImageSourceEnum", ["CAMERA", "GALLERY"]);
export type ImageSourceEnum = (typeof imageSourceEnum.enumValues)[number];

export const notificationEventStatus = pgEnum("NotificationEventStatusEnum", [
  "sent",
  "opened",
  "failed",
]);
export type NotificationEventStatusEnum =
  (typeof notificationEventStatus.enumValues)[number];

const timestampWithTz = (
  name?: string,
): ReturnType<typeof timestamp<string, "date">> =>
  timestamp(name ?? "", { precision: 3, withTimezone: true });

// Typages Dashboard : `varchar` typé (cf. ADR 0006) plutôt que pgEnum, pour
// éviter les migrations à chaque ajout de valeur.
export const BUSINESS_TYPES = ["staff", "tourist_office"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const SCOPE_MODES = ["ALL", "BOUNDARIES"] as const;
export type ScopeMode = (typeof SCOPE_MODES)[number];

const created_at = timestampWithTz("created_at").defaultNow().notNull();
const updated_at = timestampWithTz("updated_at")
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date());

// Mirrors CoordsSchema from shared-utils/geo.ts — all location columns except timestamp
const coordsColumns = {
  coords: geometry({ type: "point", srid: 4326 }).notNull(),
  accuracy: doublePrecision(),
  altitude: doublePrecision(),
  altitudeAccuracy: doublePrecision("altitude_accuracy"),
  heading: doublePrecision(),
  speed: doublePrecision(),
};

export const userLocations = pgTable(
  "user_locations",
  {
    id: serial().primaryKey().notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
    userId: varchar("user_id", { length: 1000 }).notNull(),
    ...coordsColumns,
    timestamp: timestampWithTz().notNull(),
  },
  (table) => [
    // Index composite B-tree : accélère les requêtes filtrant par utilisateur puis triant par date
    // Ex: "les N dernières positions de l'utilisateur X"
    index("user_locations_user_id_timestamp_idx").using(
      "btree",
      // op("text_ops") : classe d'opérateurs pour les comparaisons de texte (=, <, >, LIKE)
      table.userId.asc().nullsLast().op("text_ops"),
      // op("timestamptz_ops") : classe d'opérateurs pour les comparaisons de timestamptz (=, <, >)
      table.timestamp.desc().nullsLast().op("timestamptz_ops"),
    ),
    // Index spatial GiST : accélère les requêtes géographiques (ST_DWithin, ST_Contains, ST_Distance, etc.)
    index("user_locations_coords_idx").using(
      "gist",
      // op("gist_geometry_ops_2d") : classe d'opérateurs GiST pour les géométries 2D (intersection, contenance, proximité)
      table.coords.asc().nullsLast().op("gist_geometry_ops_2d"),
    ),
    // Index B-tree sur timestamp seul : accélère les requêtes par date sans filtre utilisateur
    // Ex: "toutes les positions des dernières 24h" (l'index composite ci-dessus ne couvre pas ce cas)
    index("user_locations_timestamp_idx").using(
      "btree",
      // op("timestamptz_ops") : classe d'opérateurs pour les comparaisons de timestamptz
      table.timestamp.desc().nullsLast().op("timestamptz_ops"),
    ),
    // Clé étrangère vers la table users, avec suppression / mise à jour en cascade
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
      name: "user_locations_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const visitedPois = pgTable(
  "visited_pois",
  {
    id: serial().primaryKey().notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
    locationId: integer("location_id").notNull(),
    poiId: varchar("poi_id", { length: 1000 }).notNull(),
    userId: varchar("user_id", { length: 1000 }).notNull(),
    comment: varchar({ length: 10000 }).notNull(),
    imageKey: varchar("image_key", { length: 1000 }),
    imageSource: imageSourceEnum("image_source").default("CAMERA").notNull(),
    rating: integer().notNull(),
  },
  (table) => [
    uniqueIndex("visited_pois_user_id_poi_id_key").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.poiId.asc().nullsLast().op("text_ops"),
    ),
    index("idx_visited_pois_poi_id").using(
      "btree",
      table.poiId.asc().nullsLast().op("text_ops"),
    ),
    // Cursor pagination "mes visited POIs" : ORDER BY created_at DESC, id DESC + WHERE user_id = ?
    index("idx_visited_pois_user_id_created_at_id").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.createdAt.desc(),
      table.id.desc(),
    ),
    // Cursor pagination "qui a visité ce POI" : ORDER BY created_at DESC, id DESC + WHERE poi_id = ?
    index("idx_visited_pois_poi_id_created_at_id").using(
      "btree",
      table.poiId.asc().nullsLast().op("text_ops"),
      table.createdAt.desc(),
      table.id.desc(),
    ),
    index("idx_visited_pois_location_id").using(
      "btree",
      table.locationId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
      name: "visited_pois_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [userLocations.id],
      name: "visited_pois_location_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ],
);

export const poiData = pgTable(
  "poi_data",
  {
    id: serial().primaryKey().notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
    name: varchar({ length: 1000 }).notNull(),
    description: varchar({ length: 1000 }).notNull(),
    rawInfo: jsonb("raw_info").notNull(),
    source: poiDataSourceEnum().notNull(),
    sourceId: varchar("source_id", { length: 1000 }).notNull(),
    language: languageEnum().notNull(),
    poiId: varchar("poi_id", { length: 1000 }).notNull(),
    nbOfTags: integer("nb_of_tags"),
    mainCategory: varchar("main_category", { length: 100 }),
    categories: jsonb("categories").$type<string[]>(),
  },
  (table) => [
    index("idx_poi_data_poi_id").using(
      "btree",
      table.poiId.asc().nullsLast().op("text_ops"),
    ),
    index("idx_poi_data_name_normalized").using(
      "btree",
      sql`normalize_search_text((name)::text)`,
    ),
    // Index composite (poi_id, language DESC, id) pour la sous-requête scalaire de findUserZoneStats (Query A) :
    // WHERE poi_id = … ORDER BY language DESC, id LIMIT 1 (meilleur nom par POI).
    // Permet un Index Only Scan et supprime le Sort step (l'ordre du B-tree matche le ORDER BY).
    index("idx_poi_data_poi_id_lang_id").using(
      "btree",
      table.poiId.asc().nullsLast().op("text_ops"),
      table.language.desc().nullsLast().op("enum_ops"),
      table.id.asc().nullsLast(),
    ),
    uniqueIndex("poi_data_source_poi_id_language_key").using(
      "btree",
      table.source.asc().nullsLast().op("text_ops"),
      table.poiId.asc().nullsLast().op("enum_ops"),
      table.language.asc().nullsLast().op("enum_ops"),
    ),
    uniqueIndex("poi_data_source_source_id_language_key").using(
      "btree",
      table.source.asc().nullsLast().op("enum_ops"),
      table.sourceId.asc().nullsLast().op("enum_ops"),
      table.language.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const users = pgTable("users", {
  userId: varchar("user_id", { length: 1000 }).primaryKey().notNull(),
  createdAt: created_at,
  updatedAt: updated_at,
  email: varchar({ length: 1000 }),
  fullName: varchar("full_name", { length: 1000 }),
  nickname: varchar({ length: 1000 }),
  oauthProviders: varchar("oauth_providers", { length: 1000 }).array(),
  lastLogin: timestampWithTz("last_login").defaultNow().notNull(),
  role: roleEnum().default("USER").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
});

export const pushDevices = pgTable(
  "push_devices",
  {
    id: serial().primaryKey().notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
    userId: varchar("user_id", { length: 1000 }).notNull(),
    token: varchar({ length: 4000 }).notNull(),
    platform: varchar({ length: 10 }).notNull(),
    appVersion: varchar("app_version", { length: 50 }).notNull(),
    osVersion: varchar("os_version", { length: 50 }).notNull(),
    deviceModel: varchar("device_model", { length: 100 }),
    lastSeenAt: timestamp("last_seen_at", { precision: 3 }).notNull(),
    disabledAt: timestamp("disabled_at", { precision: 3 }),
  },
  (table) => [
    uniqueIndex("push_devices_token_key").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops"),
    ),
    index("push_devices_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    index("push_devices_disabled_at_idx").using(
      "btree",
      table.disabledAt.asc().nullsLast().op("timestamp_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
      name: "push_devices_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const notificationEvents = pgTable(
  "notification_events",
  {
    id: serial().primaryKey().notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
    notificationId: varchar("notification_id", { length: 50 }).notNull(),
    userId: varchar("user_id", { length: 1000 }).notNull(),
    templateKey: varchar("template_key", { length: 100 }).notNull(),
    channelId: varchar("channel_id", { length: 50 }).notNull(),
    priority: varchar({ length: 10 }).notNull(),
    titleRendered: varchar("title_rendered", { length: 500 }).notNull(),
    bodyRendered: varchar("body_rendered", { length: 2000 }).notNull(),
    variantIndex: integer("variant_index").notNull(),
    deepLink: varchar("deep_link", { length: 500 }).notNull(),
    status: notificationEventStatus().notNull(),
    failureReason: varchar("failure_reason", { length: 500 }),
    sentAt: timestampWithTz("sent_at").notNull(),
    openedAt: timestampWithTz("opened_at"),
    triggerSource: varchar("trigger_source", { length: 50 }).notNull(),
    triggerCoords: geometry("trigger_coords", { type: "point", srid: 4326 }),
  },
  (table) => [
    uniqueIndex("notification_events_notification_id_key").using(
      "btree",
      table.notificationId.asc().nullsLast().op("text_ops"),
    ),
    // Anti-spam caps (per-user, ordered by sent time)
    index("notification_events_user_id_sent_at_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.sentAt.desc().nullsLast().op("timestamptz_ops"),
    ),
    // Cooldown per template (per-user + template, ordered by sent time)
    index("notification_events_user_id_template_key_sent_at_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.templateKey.asc().nullsLast().op("text_ops"),
      table.sentAt.desc().nullsLast().op("timestamptz_ops"),
    ),
    // Spatial index on triggerCoords (location-based trigger distance checks)
    index("notification_events_trigger_coords_idx").using(
      "gist",
      table.triggerCoords.asc().nullsLast().op("gist_geometry_ops_2d"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
      name: "notification_events_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const pois = pgTable(
  "pois",
  {
    id: varchar({ length: 1000 }).primaryKey().notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
    source: poiSourceEnum().notNull(),
    sourceId: varchar("source_id", { length: 1000 }).notNull(),
    coords: geometry({ type: "point", srid: 4326 }).notNull(),
    disabled: boolean().default(false).notNull(),
    disabledReason: varchar("disabled_reason", { length: 1000 }),
    filterLevel: poiFilterLevelEnum("filter_level")
      .default("UNKNOWN")
      .notNull(),
    visitCount: integer("visit_count").default(0).notNull(),
  },
  (table) => [
    index("coords_index").using(
      "gist",
      table.coords.asc().nullsLast().op("gist_geometry_ops_2d"),
    ),
    uniqueIndex("pois_source_source_id_key").using(
      "btree",
      table.source.asc().nullsLast().op("text_ops"),
      table.sourceId.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const boundaries = pgTable(
  "boundaries",
  {
    id: varchar({ length: 1000 }).primaryKey().notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
    name: varchar({ length: 1000 }),
    boundaryLevel: boundaryLevelEnum("boundary_level").notNull(),
    rawInfo: jsonb("raw_info").notNull(),
    parentId: varchar("parent_id", { length: 1000 }),
    displayPoint: geometry("display_point", {
      type: "point",
      srid: 4326,
    }).notNull(),
    placeType: varchar("place_type", { length: 100 }).notNull(),
    population: integer().notNull(),
    isCapital: boolean("is_capital").notNull(),
    importanceScore: doublePrecision("importance_score").notNull(),
    wayArea: doublePrecision("way_area").notNull(),
  },
  (table) => [
    index("boundary_display_point_index").using(
      "gist",
      table.displayPoint.asc().nullsLast().op("gist_geometry_ops_2d"),
    ),
    index("boundary_importance_index").using(
      "btree",
      table.importanceScore.asc().nullsLast().op("float8_ops"),
    ),
    index("boundary_level_index").using(
      "btree",
      table.boundaryLevel.asc().nullsLast().op("enum_ops"),
    ),
    index("boundary_parent_index").using(
      "btree",
      table.parentId.asc().nullsLast().op("text_ops"),
    ),
    index("idx_boundaries_name_normalized").using(
      "btree",
      sql`normalize_search_text((name)::text)`,
    ),
  ],
);

export const poiBoundaries = pgTable(
  "poi_boundaries",
  {
    id: serial().primaryKey().notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
    poiId: varchar("poi_id", { length: 1000 }).notNull(),
    boundaryId: varchar("boundary_id", { length: 1000 }).notNull(),
  },
  (table) => [
    uniqueIndex("poi_boundaries_poi_id_boundary_id_key").using(
      "btree",
      table.poiId.asc().nullsLast().op("text_ops"),
      table.boundaryId.asc().nullsLast().op("text_ops"),
    ),
    index("idx_poi_boundaries_poi_id").using(
      "btree",
      table.poiId.asc().nullsLast().op("text_ops"),
    ),
    // Index sur boundary_id seul : permet les lookups par zone (Query B de findUserZoneStats : COUNT POIs par zone).
    // L'index composite (poi_id, boundary_id) ne couvre pas ce cas car boundary_id n'est pas en tête
    index("idx_poi_boundaries_boundary_id").using(
      "btree",
      table.boundaryId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.poiId],
      foreignColumns: [pois.id],
      name: "poi_boundaries_poi_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.boundaryId],
      foreignColumns: [boundaries.id],
      name: "poi_boundaries_boundary_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const processingResults = pgTable(
  "processing_results",
  {
    id: serial().primaryKey().notNull(),
    targetId: varchar("target_id", { length: 1000 }).notNull(),
    status: processingStatusEnum().notNull(),
    input: jsonb().notNull(),
    output: jsonb(),
    createdAt: created_at,
    updatedAt: updated_at,
    batchId: varchar("batch_id", { length: 1000 }),
    type: varchar("type", { length: 100 }).notNull(),
    version: integer().default(1).notNull(),
    duration: integer(),
    distance: integer(),
    isValid: boolean("is_valid"),
    cost: integer(),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("idx_processing_results_target_id").using(
      "btree",
      table.targetId.asc().nullsLast().op("text_ops"),
    ),
    index("idx_processing_results_updated_at").using(
      "btree",
      table.updatedAt.desc().nullsLast().op("timestamptz_ops"),
    ),
    // Accelerate findExistingSuccessResultByUrl: WHERE type, version, status, input->>'url'
    index("idx_processing_results_url_lookup").using(
      "btree",
      sql`(input->>'url')`,
      table.type.asc().nullsLast(),
      table.version.asc().nullsLast(),
      table.status.asc().nullsLast(),
    ),
  ],
);

export const poiEnriched = pgTable(
  "poi_enriched",
  {
    id: serial().primaryKey().notNull(),
    poiId: varchar("poi_id", { length: 1000 }).notNull(),
    source: varchar({ length: 100 }).notNull(),
    version: integer().default(1).notNull(),
    enrichedData: jsonb("enriched_data"),
    createdAt: created_at,
    updatedAt: updated_at,
  },
  (table) => [
    uniqueIndex("poi_enriched_poi_id_key").using(
      "btree",
      table.poiId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.poiId],
      foreignColumns: [pois.id],
      name: "poi_enriched_poi_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("no action"),
  ],
);

export const userFeedbacks = pgTable(
  "user_feedbacks",
  {
    id: serial().primaryKey().notNull(),
    userId: varchar("user_id", { length: 1000 }).notNull(),
    category: varchar({ length: 100 }).$type<UserFeedbackCategory>().notNull(),
    message: varchar({ length: 10000 }).notNull(),
    targetPoiId: varchar("target_poi_id", { length: 1000 }),
    location: geometry({ type: "point", srid: 4326 }),
    city: varchar({ length: 1000 }),
    payload: jsonb().$type<UserFeedbackPayload>().notNull(),
    appVersion: varchar("app_version", { length: 100 }).notNull(),
    os: varchar({ length: 100 }).notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
  },
  (table) => [
    index("idx_user_feedbacks_user_id").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    index("idx_user_feedbacks_category").using(
      "btree",
      table.category.asc().nullsLast().op("text_ops"),
    ),
    index("idx_user_feedbacks_target_poi_id").using(
      "btree",
      table.targetPoiId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
      name: "user_feedbacks_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.targetPoiId],
      foreignColumns: [pois.id],
      name: "user_feedbacks_target_poi_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

// Identités côté Dashboard (cf. ADR 0005). UUID Supabase, populations
// disjointes de `users` (Firebase / Mobile App). Pas de FK vers `auth.users`
// pour ne pas coupler nos migrations au schéma géré par Supabase ; rows
// orphelines après suppression Supabase = inerte (pas de token → pas d'accès).
export const dashboardUsers = pgTable("dashboard_users", {
  id: uuid().primaryKey().notNull(),
  createdAt: created_at,
  updatedAt: updated_at,
  email: varchar({ length: 1000 }).notNull(),
  // Nullable : Supabase OTP ne capture pas le nom à l'inscription ; peuplé plus
  // tard via un endpoint profile.
  name: varchar({ length: 1000 }),
  lastLogin: timestampWithTz("last_login").defaultNow().notNull(),
});

// Tenants du Dashboard (cf. ADR 0008). Organization = entité interne Vagagond
// (`business_type='staff'`) ou cliente B2B (`business_type='tourist_office'`).
// Le `slug` porte les URLs publiques (`/api/dashboard/orgs/:orgSlug/*`) ; l'`id`
// serial est l'identifiant interne.
export const dashboardOrganizations = pgTable("dashboard_organizations", {
  id: serial().primaryKey().notNull(),
  createdAt: created_at,
  updatedAt: updated_at,
  slug: varchar({ length: 200 }).notNull().unique(),
  name: varchar({ length: 500 }).notNull(),
  businessType: varchar("business_type", { length: 50 })
    .$type<BusinessType>()
    .notNull(),
  // Mode de scoping géographique : `ALL` = visibilité globale (typiquement
  // `business_type='staff'`), `BOUNDARIES` = restreint aux entrées de la table
  // `dashboard_organization_boundaries`.
  scopeMode: varchar("scope_mode", { length: 20 }).$type<ScopeMode>().notNull(),
  // Entitlements de l'org (cf. ADR 0009). Liste de slugs de features activées.
  // Les orgs `business_type='staff'` bypassent ce check (cf. `orgHasFeature`
  // côté shared-utils). Valeurs hors enum filtrées silencieusement à la
  // lecture par `OrganizationRepository` — pas de FK ni de contrainte CHECK.
  features: varchar({ length: 200 }).array().notNull().default([]),
  createdBy: uuid("created_by").references(() => dashboardUsers.id, {
    onDelete: "set null",
  }),
});

// Liaison N:M user ↔ org (cf. ADR 0008). Un user peut être membre de plusieurs
// orgs (staff intervenant chez un client). Tous les memberships d'une org
// confèrent les mêmes droits (pas de RBAC intra-org en V0).
export const dashboardMemberships = pgTable(
  "dashboard_memberships",
  {
    id: serial().primaryKey().notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
    userId: uuid("user_id")
      .notNull()
      .references(() => dashboardUsers.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => dashboardOrganizations.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => dashboardUsers.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("dashboard_memberships_user_org_key").on(
      table.userId,
      table.organizationId,
    ),
  ],
);

// Périmètre géographique d'une organisation (cf. ADR 0008, Boundary Scope).
// Pas de FK sur `boundary_id` : le data-manager fait du DELETE + INSERT sur
// les boundaries lors des re-imports OSM ; on tolère des liens orphelins
// temporaires que le JOIN au middleware ignore naturellement.
export const dashboardOrganizationBoundaries = pgTable(
  "dashboard_organization_boundaries",
  {
    id: serial().primaryKey().notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
    organizationId: integer("organization_id")
      .notNull()
      .references(() => dashboardOrganizations.id, { onDelete: "cascade" }),
    boundaryId: varchar("boundary_id", { length: 1000 }).notNull(),
    createdBy: uuid("created_by").references(() => dashboardUsers.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("dashboard_org_boundaries_org_boundary_key").on(
      table.organizationId,
      table.boundaryId,
    ),
    // Pour les lookups inverses (« quelles orgs scopent cette boundary ? »).
    index("dashboard_org_boundaries_boundary_id_idx").on(table.boundaryId),
  ],
);

export const appReview = pgTable(
  "app_review",
  {
    id: serial().primaryKey().notNull(),
    userId: varchar("user_id", { length: 1000 }).notNull(),
    positive: boolean().notNull(),
    comment: varchar({ length: 1000 }),
    createdAt: created_at,
    updatedAt: updated_at,
  },
  (table) => [
    uniqueIndex("app_review_user_id_key").on(table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
      name: "app_review_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

// Compteurs polymorphes par période — cf. ADR-0002.
// period_type est varchar + union TS pour pouvoir ajouter "weekly"/"yearly"/event sans migration.
export type PeriodType = "all_time" | "monthly";

export const userPeriodScores = pgTable(
  "user_period_scores",
  {
    id: serial().primaryKey().notNull(),
    userId: varchar("user_id", { length: 1000 }).notNull(),
    periodType: varchar("period_type", { length: 50 })
      .$type<PeriodType>()
      .notNull(),
    periodKey: varchar("period_key", { length: 32 }).notNull(),
    count: integer().default(0).notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
  },
  (table) => [
    // Unicité sur le triplet métier — ON CONFLICT cible cet index.
    uniqueIndex("user_period_scores_uniq").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.periodType.asc().nullsLast().op("text_ops"),
      table.periodKey.asc().nullsLast().op("text_ops"),
    ),
    // Sert ORDER BY count DESC pour le leaderboard, après filtrage (period_type, period_key)
    index("idx_user_period_scores_leaderboard").using(
      "btree",
      table.periodType.asc().nullsLast().op("text_ops"),
      table.periodKey.asc().nullsLast().op("text_ops"),
      table.count.desc(),
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
      name: "user_period_scores_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const visitedPoisRelations = relations(visitedPois, ({ one }) => ({
  user: one(users, {
    fields: [visitedPois.userId],
    references: [users.userId],
  }),
  location: one(userLocations, {
    fields: [visitedPois.locationId],
    references: [userLocations.id],
  }),
}));

export const userLocationsRelations = relations(
  userLocations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [userLocations.userId],
      references: [users.userId],
    }),
    visitedPois: many(visitedPois),
  }),
);

export const usersRelations = relations(users, ({ many, one }) => ({
  visitedPois: many(visitedPois),
  userLocations: many(userLocations),
  userFeedbacks: many(userFeedbacks),
  pushDevices: many(pushDevices),
  notificationEvents: many(notificationEvents),
  appReview: one(appReview, {
    fields: [users.userId],
    references: [appReview.userId],
  }),
}));

export const pushDevicesRelations = relations(pushDevices, ({ one }) => ({
  user: one(users, {
    fields: [pushDevices.userId],
    references: [users.userId],
  }),
}));

export const notificationEventsRelations = relations(
  notificationEvents,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationEvents.userId],
      references: [users.userId],
    }),
  }),
);

export const poiBoundariesRelations = relations(poiBoundaries, ({ one }) => ({
  pois: one(pois, {
    fields: [poiBoundaries.poiId],
    references: [pois.id],
  }),
  boundary: one(boundaries, {
    fields: [poiBoundaries.boundaryId],
    references: [boundaries.id],
  }),
}));

export const poisRelations = relations(pois, ({ many }) => ({
  poiBoundaries: many(poiBoundaries),
  userFeedbacks: many(userFeedbacks),
}));

export const boundariesRelations = relations(boundaries, ({ many }) => ({
  poiBoundaries: many(poiBoundaries),
}));

export const poiEnrichedRelations = relations(poiEnriched, ({ one }) => ({
  poi: one(pois, {
    fields: [poiEnriched.poiId],
    references: [pois.id],
  }),
}));

export const userFeedbacksRelations = relations(userFeedbacks, ({ one }) => ({
  user: one(users, {
    fields: [userFeedbacks.userId],
    references: [users.userId],
  }),
  targetPoi: one(pois, {
    fields: [userFeedbacks.targetPoiId],
    references: [pois.id],
  }),
}));

export const appReviewRelations = relations(appReview, ({ one }) => ({
  user: one(users, {
    fields: [appReview.userId],
    references: [users.userId],
  }),
}));
