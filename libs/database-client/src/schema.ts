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

const created_at = timestamp("created_at", { precision: 3 })
  .defaultNow()
  .notNull();
const updated_at = timestamp("updated_at", { precision: 3 })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date());

export const userLocations = pgTable(
  "user_locations",
  {
    id: serial().primaryKey().notNull(),
    createdAt: created_at,
    updatedAt: updated_at,
    userId: varchar("user_id", { length: 1000 }).notNull(),
    coords: geometry({ type: "point", srid: 4326 }).notNull(),
    accuracy: doublePrecision(),
    altitude: doublePrecision(),
    altitudeAccuracy: doublePrecision("altitude_accuracy"),
    heading: doublePrecision(),
    speed: doublePrecision(),
    timestamp: timestamp({ precision: 3 }).notNull(),
  },
  (table) => [
    // Index composite B-tree : accélère les requêtes filtrant par utilisateur puis triant par date
    // Ex: "les N dernières positions de l'utilisateur X"
    index("user_locations_user_id_timestamp_idx").using(
      "btree",
      // op("text_ops") : classe d'opérateurs pour les comparaisons de texte (=, <, >, LIKE)
      table.userId.asc().nullsLast().op("text_ops"),
      // op("timestamp_ops") : classe d'opérateurs pour les comparaisons de timestamps (=, <, >)
      table.timestamp.desc().nullsLast().op("timestamp_ops"),
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
      // op("timestamp_ops") : classe d'opérateurs pour les comparaisons de timestamps
      table.timestamp.desc().nullsLast().op("timestamp_ops"),
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
    coords: geometry({ type: "point", srid: 4326 }),
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
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
      name: "visited_pois_user_id_fkey",
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
  lastLogin: timestamp("last_login", { precision: 3 }).defaultNow().notNull(),
  role: roleEnum().default("USER").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
});

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
      table.updatedAt.desc().nullsLast().op("timestamp_ops"),
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

export const visitedPoisRelations = relations(visitedPois, ({ one }) => ({
  user: one(users, {
    fields: [visitedPois.userId],
    references: [users.userId],
  }),
}));

export const userLocationsRelations = relations(userLocations, ({ one }) => ({
  user: one(users, {
    fields: [userLocations.userId],
    references: [users.userId],
  }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  visitedPois: many(visitedPois),
  userLocations: many(userLocations),
  appReview: one(appReview, {
    fields: [users.userId],
    references: [appReview.userId],
  }),
}));

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

export const appReviewRelations = relations(appReview, ({ one }) => ({
  user: one(users, {
    fields: [appReview.userId],
    references: [users.userId],
  }),
}));
