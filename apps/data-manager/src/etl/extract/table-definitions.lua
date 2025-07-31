-- Table definitions for osm2pgsql processing
-- Defines database table structures for POIs and boundaries
local M = {}

-- Define the raw_pois table structure
M.pois = osm2pgsql.define_table({
    name = 'raw_pois',
    ids = {
        type = 'any',
        type_column = 'osm_type',
        id_column = 'osm_id'
    },
    columns = {{
        column = 'name',
        type = 'text',
        not_null = true
    }, {
        column = 'class',
        type = 'text',
        not_null = true
    }, {
        column = 'subclass',
        type = 'text',
        not_null = true
    }, {
        column = 'geom',
        type = 'point',
        not_null = true
    }, {
        column = 'tags',
        type = 'jsonb'
    }}
})

-- Define the boundaries table structure
M.boundaries = osm2pgsql.define_table({
    name = 'boundaries',
    ids = {
        type = 'any',
        type_column = 'osm_type',
        id_column = 'osm_id'
    },
    columns = {{
        column = 'name',
        type = 'text',
        not_null = true
    }, {
        column = 'admin_level',
        type = 'text',
        not_null = true
    }, {
        column = 'wikidata',
        type = 'text'
    }, {
        column = 'wikipedia',
        type = 'text'
    }, {
        column = 'geom',
        type = 'geometry',
        not_null = true
    }, {
        column = 'tags',
        type = 'jsonb'
    }}
})

return M
