-- Admin centre processor for place nodes referenced as admin_centre in boundary relations
-- Handles processing and insertion of admin_centre objects into the admin_centres table
local M = {}

-- Store admin_centre references found during boundary processing
-- This will be populated by boundary-processor when it finds admin_centre members
M.admin_centre_refs = {}

-- Register an admin_centre reference from a boundary relation
function M.register_admin_centre_ref(boundary_osm_id, boundary_osm_type, admin_centre_ref, admin_centre_type)
    M.admin_centre_refs[admin_centre_ref] = {
        boundary_osm_id = boundary_osm_id,
        boundary_osm_type = boundary_osm_type,
        admin_centre_type = admin_centre_type
    }
end

-- Calculate importance score based on OSM placenames logic
local function calculate_importance_score(tags, display_name)
    local population = tonumber(tags.population) or 0
    local base_score = 0

    -- Base score by place type (matching OSM placenames-project.mml logic)
    if tags.place == "city" then
        base_score = population > 0 and population or 100000
    elseif tags.place == "town" then
        base_score = population > 0 and population or 1000
    elseif tags.place == "village" then
        base_score = population > 0 and population or 100
    elseif tags.place == "hamlet" then
        base_score = population > 0 and population or 50
    else
        base_score = population > 0 and population or 1
    end

    -- Capital bonus (matching OSM logic)
    local capital_multiplier = 1
    if tags.capital == "yes" then
        capital_multiplier = 4 -- National capital
    elseif tags.capital == "4" then
        capital_multiplier = 2 -- Regional capital
    end

    return base_score * capital_multiplier
end

-- Get capital level from tags
local function get_capital_level(tags)
    if tags.capital == "yes" then
        return 2 -- National capital (admin_level=2)
    elseif tags.capital == "4" then
        return 4 -- Regional capital (admin_level=4)
    elseif tags.capital == "6" then
        return 6 -- County capital (admin_level=6)
    elseif tags.capital == "8" then
        return 8 -- City capital (admin_level=8)
    end
    return nil
end

-- Check if it's a capital
local function is_capital(tags)
    return tags.capital == "yes" or tags.capital == "4" or tags.capital == "6" or tags.capital == "8"
end

-- Validate place type
local function is_valid_place_type(place_type)
    local valid_places = {
        city = true,
        town = true,
        village = true,
        hamlet = true,
        suburb = true,
        quarter = true,
        neighbourhood = true,
        isolated_dwelling = true,
        farm = true
    }
    return valid_places[place_type] or false
end

-- Process an admin_centre object (place node) and prepare data for insertion
function M.process_admin_centre(tables, object, geom)
    -- Process all place nodes - association with boundaries will be done later in transform.ts

    -- Get display name with fallback: name -> label -> skip
    local display_name = object.tags.name
    if not display_name or display_name == "" then
        display_name = object.tags.label
    end

    if not display_name or display_name == "" then
        print("Warning: admin_centre node " .. tostring(object.id) .. " has no name or label - skipping")
        return
    end

    -- Validate place type if present
    local place_type = object.tags.place
    if place_type and not is_valid_place_type(place_type) then
        print("Warning: admin_centre node " .. tostring(object.id) .. " has invalid place type '" ..
                  tostring(place_type) .. "' - will be null")
        place_type = nil
    end

    local population = tonumber(object.tags.population)

    local current_admin_centre = {
        boundary_osm_id = nil, -- Will be filled during transform.ts
        boundary_osm_type = nil, -- Will be filled during transform.ts  
        name = display_name,
        place_type = place_type,
        population = population,
        is_capital = is_capital(object.tags),
        capital_level = get_capital_level(object.tags),
        importance_score = calculate_importance_score(object.tags, display_name),
        geom = geom,
        tags = object.tags
    }

    print("Processing admin_centre: " .. display_name .. " (place=" .. tostring(place_type) .. ", pop=" ..
              tostring(population) .. ", score=" .. tostring(current_admin_centre.importance_score) .. ")")

    tables.admin_centres:insert(current_admin_centre)
end

return M
