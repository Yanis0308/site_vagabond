local M = {}

-- Priority list for main_category determination (lower index = higher priority)
-- Must include all categories returned by resolve_category; unknown categories get DEFAULT_PRIORITY
local PRIORITY_CATEGORIES = {
  stadium = 1,
  aquarium = 2,
  zoo = 3,
  museum = 4,
  castle = 5,
  place_of_worship = 6,
  monument = 7,
  theatre = 8,
  townhall = 9,
  fountain = 10,
  bridge = 11,
  marina = 12,
  tower = 13,
  viewpoint = 14,
  memorial = 15,
  sculpture = 16,
  artwork = 17,
  small_monument = 18,
  attraction = 19,
  park = 20,
}

-- Default priority for unknown categories (sorted last for main_category)
local DEFAULT_PRIORITY = 999

--- Returns the priority of a category
-- @param category The category name
-- @return Numeric priority (lower is better)
function M.get_priority(category)
  return PRIORITY_CATEGORIES[category] or DEFAULT_PRIORITY
end

--- Resolves the canonical category for a POI based on its metadata
-- @param poi_data Table containing class, subclass, filter_level, and optional metadata
-- @return The mapped category string
function M.resolve_category(poi_data)
  local subclass = poi_data.subclass

  -- 1. Map precise types from artwork_type (must run first: overrides subclass)
  if poi_data.artwork_type == "statue" or poi_data.artwork_type == "sculpture" then
    return "sculpture"
  end
  if poi_data.artwork_type == "fountain" then
    return "fountain"
  end

  -- 2. Subclass already maps to a known category (e.g. museum, tower, attraction)
  if PRIORITY_CATEGORIES[subclass] then
    return subclass
  end

  -- 3. Handle specific subclass overrides
  if subclass == "fort" then
    return "castle"
  end

  -- 4. Normalize bridge subtypes (viaduct, suspension, etc.) to "bridge"
  if poi_data.class == "bridge" or (poi_data.class == "man_made" and subclass == "bridge") then
    return "bridge"
  end

  -- 5. Handle heritage logic (subclass "heritage")
  if subclass == "heritage" then
    -- Government buildings detected as heritage are always small monuments
    if poi_data.class == "government" then
      return "small_monument"
    end

    -- heritage_level 1 or 2 = important monument, 3 or nil = small monument
    local is_important =
      poi_data.heritage_level and poi_data.heritage_level <= 2

    if is_important then
      return "monument"
    else
      return "small_monument"
    end
  end

  -- 6. Map generic identifiers to 'small_monument' (government, building, yes, citywalls, city_gate)
  if subclass == "government" or subclass == "building" or subclass == "yes" or subclass == "citywalls" or subclass == "city_gate" then
    return "small_monument"
  end

  return subclass
end

return M
