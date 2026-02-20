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
export type VisitedPoiStatus = (typeof visitedPoiStatus.enumValues)[number];

export const processingStatusEnum = pgEnum("ProcessingStatusEnum", [
  "pending",
  "success",
  "error",
]);
export type ProcessingStatusEnum =
  (typeof processingStatusEnum.enumValues)[number];

export const processingTypeEnum = pgEnum("ProcessingTypeEnum", [
  "scraper-maps",
  "scraper-web",
  "llm",
  "wikidata",
  "wikipedia",
]);
export type ProcessingTypeEnum = (typeof processingTypeEnum.enumValues)[number];

const created_at = timestamp("created_at", { precision: 3 })
  .defaultNow()
  .notNull();
const updated_at = timestamp("updated_at", { precision: 3 })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date());

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
    imageKey: varchar("image_key", { length: 1000 }).notNull(),
    rating: integer().notNull(),
  },
  (table) => [
    uniqueIndex("visited_pois_user_id_poi_id_key").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
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
    index("idx_poi_data_name_normalized").using(
      "btree",
      sql`normalize_search_text((name)::text)`,
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
  oauthProviders: varchar("oauth_providers", { length: 1000 }).array(),
  lastLogin: timestamp("last_login", { precision: 3 }).defaultNow().notNull(),
  role: roleEnum().default("USER").notNull(),
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

export const processingResults = pgTable("processing_results", {
  id: serial().primaryKey().notNull(),
  targetId: varchar("target_id", { length: 1000 }).notNull(),
  status: processingStatusEnum().notNull(),
  input: jsonb().notNull(),
  output: jsonb(),
  createdAt: created_at,
  updatedAt: updated_at,
  batchId: varchar("batch_id", { length: 1000 }),
  type: processingTypeEnum().notNull(),
  version: integer().default(1).notNull(),
  duration: integer(),
  distance: integer(),
  isValid: boolean("is_valid"),
  cost: integer(),
  metadata: jsonb("metadata"),
});

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

export const visitedPoisRelations = relations(visitedPois, ({ one }) => ({
  user: one(users, {
    fields: [visitedPois.userId],
    references: [users.userId],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  visitedPois: many(visitedPois),
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
