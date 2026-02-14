-- POI filters based on Overpass V1.1 query criteria
-- Contains all the filtering logic for determining which OSM objects should be imported as POIs
-- Implements 4-level filtering system: strict, standard, intermediaire, laxiste
local M = {}

-- Filter level constants (lower number = higher filter level)
local FILTER_LEVEL_STRICT = 1
local FILTER_LEVEL_STANDARD = 2
local FILTER_LEVEL_INTERMEDIAIRE = 3
local FILTER_LEVEL_LAXISTE = 4

-- Helper function to check if wikidata or wikipedia is present
local function has_wiki_reference(tags)
  return tags.wikidata or tags.wikipedia
end

-- List of generic name patterns to exclude
local excluded_name_patterns = {
  "^maisons?$",
  "^immeubles?$",
  "^h%S+tels? particuliers?$", -- Using %S to handle any non-space character (lua regex are specific)
}

-- Helper function to check if name should be excluded
local function should_exclude_name(tags)
  if not tags.name then
    return true
  end

  -- Normalize name: trim whitespace, convert to lowercase, collapse multiple spaces
  local name =
    tags.name:gsub("^%s+", ""):gsub("%s+$", ""):gsub("%s+", " "):lower()

  -- Check if name is empty
  if name == "" then
    return true
  end

  -- Check against excluded patterns
  for _, pattern in ipairs(excluded_name_patterns) do
    if name:match(pattern) then
      return true
    end
  end

  return false
end

-- Tourism filter handler
local function filter_tourism(tags)
  -- Filter level STRICT: tourism = attraction + heritage=1 + (wikidata or wikipedia)
  if tags.tourism == "attraction" and tags.heritage == "1" and has_wiki_reference(
    tags
  ) then
    return {
      class = "tourism",
      subclass = "attraction",
      filter_level = FILTER_LEVEL_STRICT,
    }
  end

  -- Filter level STRICT: tourism = zoo, monument, tower, museum, aquarium + (wikidata or wikipedia)
  if (tags.tourism == "zoo" or tags.tourism == "monument" or tags.tourism == "tower" or tags.tourism == "museum" or tags.tourism == "aquarium") and has_wiki_reference(
    tags
  ) then
    return {
      class = "tourism",
      subclass = tags.tourism,
      filter_level = FILTER_LEVEL_STRICT,
    }
  end

  -- Filter level STRICT: tourism = artwork + artwork_type=(statue|sculpture|fountain) + (wikidata or wikipedia)
  if tags.tourism == "artwork" and (tags.artwork_type == "statue" or tags.artwork_type == "sculpture" or tags.artwork_type == "fountain") and has_wiki_reference(
    tags
  ) then
    return {
      class = "tourism",
      subclass = "artwork",
      filter_level = FILTER_LEVEL_STRICT,
    }
  end

  -- Filter level STRICT: tourism = bridge + (wikidata or wikipedia)
  if tags.tourism == "bridge" and has_wiki_reference(tags) then
    return {
      class = "tourism",
      subclass = "bridge",
      filter_level = FILTER_LEVEL_STRICT,
    }
  end

  -- Filter level STANDARD: tourism = attraction + heritage=2 + (wikidata or wikipedia)
  if tags.tourism == "attraction" and tags.heritage == "2" and has_wiki_reference(
    tags
  ) then
    return {
      class = "tourism",
      subclass = "attraction",
      filter_level = FILTER_LEVEL_STANDARD,
    }
  end

  -- Filter level STANDARD: tourism = museum, aquarium (no wikidata required)
  if tags.tourism == "museum" or tags.tourism == "aquarium" then
    return {
      class = "tourism",
      subclass = tags.tourism,
      filter_level = FILTER_LEVEL_STANDARD,
    }
  end

  -- Filter level INTERMEDIAIRE: tourism = attraction (no conditions)
  if tags.tourism == "attraction" then
    return {
      class = "tourism",
      subclass = "attraction",
      filter_level = FILTER_LEVEL_INTERMEDIAIRE,
    }
  end

  -- Filter level INTERMEDIAIRE: tourism = zoo, monument, tower, museum, aquarium (no conditions)
  if tags.tourism == "zoo" or tags.tourism == "monument" or tags.tourism == "tower" or tags.tourism == "museum" or tags.tourism == "aquarium" then
    return {
      class = "tourism",
      subclass = tags.tourism,
      filter_level = FILTER_LEVEL_INTERMEDIAIRE,
    }
  end

  -- Filter level INTERMEDIAIRE: tourism = artwork + artwork_type=(statue|sculpture|fountain) (no wikidata required)
  if tags.tourism == "artwork" and (tags.artwork_type == "statue" or tags.artwork_type == "sculpture" or tags.artwork_type == "fountain") then
    return {
      class = "tourism",
      subclass = "artwork",
      filter_level = FILTER_LEVEL_INTERMEDIAIRE,
    }
  end

  -- Filter level INTERMEDIAIRE: tourism = viewpoint
  if tags.tourism == "viewpoint" then
    return {
      class = "tourism",
      subclass = "viewpoint",
      filter_level = FILTER_LEVEL_INTERMEDIAIRE,
    }
  end

  return nil
end

-- Historic filter handler
local function filter_historic(tags)
  -- Filter level STRICT: historic = castle, monument, memorial, city_gate, fort, citywalls, tower, yes + (wikidata or wikipedia)
  if (tags.historic == "castle" or tags.historic == "monument" or tags.historic == "memorial" or tags.historic == "city_gate" or tags.historic == "fort" or tags.historic == "citywalls" or tags.historic == "tower" or tags.historic == "yes") and has_wiki_reference(
    tags
  ) then
    return {
      class = "historic",
      subclass = tags.historic,
      filter_level = FILTER_LEVEL_STRICT,
    }
  end

  -- Filter level STRICT: historic = yes|building + heritage = 1|2 + (wikidata or wikipedia)
  if (tags.historic == "yes" or tags.historic == "building") and (tags.heritage == "1" or tags.heritage == "2") and has_wiki_reference(
    tags
  ) then
    return {
      class = "historic",
      subclass = tags.historic,
      filter_level = FILTER_LEVEL_STRICT,
    }
  end

  -- Filter level STANDARD: historic = building (no conditions)
  if tags.historic == "building" then
    return {
      class = "historic",
      subclass = "building",
      filter_level = FILTER_LEVEL_STANDARD,
    }
  end

  -- Filter level INTERMEDIAIRE: heritage = 1|2|3 + (wikidata or wikipedia)
  if (tags.heritage == "1" or tags.heritage == "2" or tags.heritage == "3") and has_wiki_reference(
    tags
  ) then
    return {
      class = "historic",
      subclass = "heritage",
      filter_level = FILTER_LEVEL_INTERMEDIAIRE,
    }
  end

  -- Filter level INTERMEDIAIRE: historic = city_gate, fort, tower (no conditions)
  if tags.historic == "city_gate" or tags.historic == "fort" or tags.historic == "tower" then
    return {
      class = "historic",
      subclass = tags.historic,
      filter_level = FILTER_LEVEL_INTERMEDIAIRE,
    }
  end

  -- Filter level INTERMEDIAIRE: historic = yes, building (no conditions)
  if tags.historic == "yes" or tags.historic == "building" then
    return {
      class = "historic",
      subclass = tags.historic,
      filter_level = FILTER_LEVEL_INTERMEDIAIRE,
    }
  end

  -- Filter level LAXISTE: heritage = 1|2|3 (no wikidata required)
  if tags.heritage == "1" or tags.heritage == "2" or tags.heritage == "3" then
    return {
      class = "historic",
      subclass = "heritage",
      filter_level = FILTER_LEVEL_LAXISTE,
    }
  end

  -- Filter level LAXISTE: historic = monument (no conditions)
  if tags.historic == "monument" then
    return {
      class = "historic",
      subclass = "monument",
      filter_level = FILTER_LEVEL_LAXISTE,
    }
  end

  return nil
end

-- Building filter handler (now handled via historic filter)
local function filter_building(tags)
  -- Building filtering is now handled through the historic filter
  -- This function is kept for compatibility but returns nil
  return nil
end

-- Amenity filter handler
local function filter_amenity(tags)
  -- Filter level STRICT: amenity = place_of_worship, townhall, theatre + (wikidata or wikipedia)
  if (tags.amenity == "place_of_worship" or tags.amenity == "townhall" or tags.amenity == "theatre") and has_wiki_reference(
    tags
  ) then
    return {
      class = "amenity",
      subclass = tags.amenity,
      filter_level = FILTER_LEVEL_STRICT,
    }
  end

  -- Filter level STRICT: amenity = fountain + heritage = 1|2 + (wikidata or wikipedia)
  if tags.amenity == "fountain" and (tags.heritage == "1" or tags.heritage == "2") and has_wiki_reference(
    tags
  ) then
    return {
      class = "amenity",
      subclass = "fountain",
      filter_level = FILTER_LEVEL_STRICT,
    }
  end

  -- Filter level INTERMEDIAIRE: amenity = fountain, townhall (no conditions)
  if tags.amenity == "fountain" or tags.amenity == "townhall" then
    return {
      class = "amenity",
      subclass = tags.amenity,
      filter_level = FILTER_LEVEL_INTERMEDIAIRE,
    }
  end

  return nil
end

-- Bridge filter handler
local function filter_bridge(tags)
  -- Filter level STRICT: bridge + (wikidata or wikipedia)
  if tags.bridge and has_wiki_reference(tags) then
    return {
      class = "bridge",
      subclass = tags.bridge,
      filter_level = FILTER_LEVEL_STRICT,
    }
  end
  return nil
end

-- Man_made filter handler
local function filter_man_made(tags)
  -- Filter level STRICT: man_made = bridge + (wikidata or wikipedia)
  if tags.man_made == "bridge" and has_wiki_reference(tags) then
    return {
      class = "man_made",
      subclass = "bridge",
      filter_level = FILTER_LEVEL_STRICT,
    }
  end
  return nil
end

-- Leisure filter handler
local function filter_leisure(tags)
  -- Filter level STRICT: leisure = marina + (wikidata or wikipedia)
  -- Note: park is commented out to reduce volume
  if tags.leisure == "marina" and has_wiki_reference(tags) then
    return {
      class = "leisure",
      subclass = tags.leisure,
      filter_level = FILTER_LEVEL_STRICT,
    }
  end

  return nil
end

-- Government filter handler
local function filter_government(tags)
  -- Filter level STRICT: government + heritage = 1|2|3
  if tags.government and tags.heritage then
    local heritage_num = tonumber(tags.heritage)
    if heritage_num and heritage_num >= 1 and heritage_num <= 3 then
      return {
        class = "government",
        subclass = "heritage",
        filter_level = FILTER_LEVEL_STRICT,
      }
    end
  end
  return nil
end

-- Landuse filter handler (removed as not present in v1.1)
local function filter_landuse(tags)
  -- Landuse filtering removed in v1.1
  return nil
end

-- Heritage filter handler (cross-category)
local function filter_heritage(tags)
  -- Filter level INTERMEDIAIRE: heritage = 1|2|3 + (wikidata or wikipedia)
  if (tags.heritage == "1" or tags.heritage == "2" or tags.heritage == "3") and has_wiki_reference(
    tags
  ) then
    return {
      class = "heritage",
      subclass = "heritage",
      filter_level = FILTER_LEVEL_INTERMEDIAIRE,
    }
  end

  -- Filter level LAXISTE: heritage = 1|2|3 (no wikidata required)
  if tags.heritage == "1" or tags.heritage == "2" or tags.heritage == "3" then
    return {
      class = "heritage",
      subclass = "heritage",
      filter_level = FILTER_LEVEL_LAXISTE,
    }
  end

  return nil
end

-- Main filter mapping table
local poi_filters = {
  tourism = filter_tourism,
  historic = filter_historic,
  building = filter_building,
  amenity = filter_amenity,
  bridge = filter_bridge,
  man_made = filter_man_made,
  leisure = filter_leisure,
  government = filter_government,
  landuse = filter_landuse,
  heritage = filter_heritage,
}

-- Main function to check if an OSM object matches POI criteria
function M.get_poi_data(tags)
  -- First check if name should be excluded
  if should_exclude_name(tags) then
    return nil
  end

  local best_poi_data = nil
  local best_filter_level = 999

  -- Check all category filters and find the one with best filter level (lowest number)
  for tag_type, filter_func in pairs(poi_filters) do
    if tags[tag_type] then
      local poi_data = filter_func(tags)
      if poi_data and poi_data.filter_level and poi_data.filter_level < best_filter_level then
        best_poi_data = poi_data
        best_filter_level = poi_data.filter_level
      end
    end
  end

  return best_poi_data
end

return M
