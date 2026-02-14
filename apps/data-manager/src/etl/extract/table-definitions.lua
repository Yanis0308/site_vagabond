-- Table definitions for osm2pgsql processing
-- Defines database table structures for POIs and boundaries
local M = {}

-- Define the raw_pois table structure
M.pois = osm2pgsql.define_table({
  name = "raw_pois",
  ids = {
    type = "any",
    type_column = "osm_type",
    id_column = "osm_id",
  },
  columns = { {
    column = "name",
    type = "text",
    not_null = true,
  }, {
    column = "class",
    type = "text",
    not_null = true,
  }, {
    column = "subclass",
    type = "text",
    not_null = true,
  }, {
    column = "filter_level",
    type = "int",
    not_null = true,
  }, {
    column = "geom",
    type = "point",
    not_null = true,
  }, {
    column = "tags",
    type = "jsonb",
  } },
})

-- Define the boundaries table structure
M.boundaries = osm2pgsql.define_table({
  name = "boundaries",
  ids = {
    type = "any",
    type_column = "osm_type",
    id_column = "osm_id",
  },
  columns = { {
    column = "name",
    type = "text",
    not_null = true,
  }, {
    column = "admin_level",
    type = "int",
    not_null = true,
  }, {
    column = "geom",
    type = "multipolygon",
    not_null = true,
  }, {
    column = "admin_centre_members",
    type = "jsonb",
  }, {
    column = "tags",
    type = "jsonb",
  } },
})

-- Define the admin_centres table structure
M.admin_centres = osm2pgsql.define_table({
  name = "admin_centres",
  ids = {
    type = "any",
    type_column = "osm_type",
    id_column = "osm_id",
  },
  columns = { {
    column = "boundary_osm_id",
    type = "bigint",
  }, {
    column = "boundary_osm_type",
    type = "text",
  }, {
    column = "name",
    type = "text",
    not_null = true,
  }, {
    column = "place_type",
    type = "text",
  }, {
    column = "population",
    type = "int",
  }, {
    column = "is_capital",
    type = "boolean",
  }, {
    column = "capital_level",
    type = "int",
  }, {
    column = "importance_score",
    type = "int",
  }, {
    column = "geom",
    type = "point",
    not_null = true,
  }, {
    column = "tags",
    type = "jsonb",
  } },
})

return M
