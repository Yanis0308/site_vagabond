-- Main import script for OSM Points of Interest and administrative boundaries
-- Uses modular approach for better code organization and maintainability
-- Add current directory to package path for module loading
local script_path = debug.getinfo(1, "S").source:sub(2):match("(.*/)")
if script_path then
  package.path = script_path .. "?.lua;" .. package.path
end

-- Import modules
local tables = require("table-definitions")
local poi_filters = require("poi-filters")
local boundary_processor = require("boundary-processor")
local admin_centre_processor = require("admin-centre-processor")

-- Process POI objects using the filter module
function process_poi(object, geom)
  -- Vérifier si la géométrie est valide avant de continuer
  if geom:is_null() then return end

  local poi_data = poi_filters.get_poi_data(object.tags)

  if poi_data then
    local current_poi = {
      name = object.tags.name,
      wikidata = object.tags.wikidata,
      wikipedia = object.tags.wikipedia,
      geom = geom,
      tags = object.tags,
      class = poi_data.class,
      subclass = poi_data.subclass,
      filter_level = poi_data.filter_level,
    }

    tables.pois:insert(current_poi)
  end
end

-- Process boundary with geometry validation
function process_boundary(tables, object, geom)
  -- Vérifier si la géométrie est valide avant de continuer
  if geom:is_null() then return end

  boundary_processor.process_boundary(tables, object, geom)
end

-- Process admin_centre with geometry validation
function process_admin_centre(tables, object, geom)
  -- Vérifier si la géométrie est valide avant de continuer
  if geom:is_null() then return end

  admin_centre_processor.process_admin_centre(tables, object, geom)
end

-- Process nodes - check if they match POI criteria
function osm2pgsql.process_node(object)
  local geom = object:as_point()

  -- Process as POI
  process_poi(object, geom)

  -- Also process as potential admin_centre if it has place tag
  if object.tags.place then
    process_admin_centre(tables, object, geom)
  end
end

-- Process ways - check if they match POI criteria
function osm2pgsql.process_way(object)
  if object.is_closed then
    local geom = object:as_polygon()
    -- Toujours appeler process_poi avec le centroïde, la vérification geom:is_null() se fait à l'intérieur
    process_poi(object, geom:centroid())
  end
end

-- Process relations - handle both boundaries and POIs
function osm2pgsql.process_relation(object)
  -- Check for administrative boundary relations
  if object.tags.boundary == "administrative" and object.tags.admin_level then
    if object.tags.type == "boundary" then
      local geom = object:as_multipolygon()
      -- Toujours appeler process_boundary, la vérification geom:is_null() se fait à l'intérieur
      process_boundary(tables, object, geom)
    end
    -- Check for multipolygon POIs
  else
    local geom = object:as_multipolygon()
    -- Toujours appeler process_poi avec le centroïde, la vérification se fait à l'intérieur
    process_poi(object, geom:centroid())
  end
end


-- Association with boundaries will be done in transform.ts