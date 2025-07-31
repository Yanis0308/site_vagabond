-- POI filters based on Overpass V1 query criteria
-- Contains all the filtering logic for determining which OSM objects should be imported as POIs
local M = {}

-- Tourism filter handler
local function filter_tourism(tags)
    -- tourism = attraction + wikidata obligatoire + heritage = 1 ou 2
    if tags.tourism == "attraction" and tags.wikidata and tags.heritage and
        (tags.heritage == "1" or tags.heritage == "2") then
        return {
            class = "tourism",
            subclass = "attraction"
        }
    end

    -- tourism = zoo, monument, tower, aquarium (pas de wikidata obligatoire)
    if tags.tourism == "zoo" or tags.tourism == "monument" or tags.tourism == "tower" or tags.tourism == "aquarium" then
        return {
            class = "tourism",
            subclass = tags.tourism
        }
    end

    -- tourism = museum (pas de wikidata obligatoire en V1)
    if tags.tourism == "museum" then
        return {
            class = "tourism",
            subclass = "museum"
        }
    end

    -- tourism = information + information=office uniquement
    if tags.tourism == "information" and tags.information == "office" then
        return {
            class = "tourism",
            subclass = "information"
        }
    end

    -- tourism = artwork + artwork_type=statue (wikidata obligatoire)
    if tags.tourism == "artwork" and tags.artwork_type == "statue" and tags.wikidata then
        return {
            class = "tourism",
            subclass = "artwork"
        }
    end

    -- tourism = viewpoint (aucune condition supplémentaire)
    if tags.tourism == "viewpoint" then
        return {
            class = "tourism",
            subclass = "viewpoint"
        }
    end

    return nil
end

-- Historic filter handler
local function filter_historic(tags)
    -- historic = castle, monument, memorial, yes + wikidata obligatoire
    if (tags.historic == "castle" or tags.historic == "monument" or tags.historic == "memorial" or tags.historic ==
        "yes") and tags.wikidata then
        return {
            class = "historic",
            subclass = tags.historic
        }
    end

    -- historic = city_gate, fort, citywalls + wikidata obligatoire
    if (tags.historic == "city_gate" or tags.historic == "fort" or tags.historic == "citywalls") and tags.wikidata then
        return {
            class = "historic",
            subclass = tags.historic
        }
    end

    return nil
end

-- Building filter handler
local function filter_building(tags)
    -- building + historic = yes + wikidata obligatoire
    if tags.building and tags.historic and tags.wikidata then
        return {
            class = "building",
            subclass = "historic"
        }
    end

    -- building + historic = yes + memorial (pas de wikidata obligatoire)
    if tags.building and tags.historic and tags.memorial then
        return {
            class = "building",
            subclass = "memorial"
        }
    end

    return nil
end

-- Amenity filter handler
local function filter_amenity(tags)
    -- amenity = place_of_worship + wikidata obligatoire
    if tags.amenity == "place_of_worship" and tags.wikidata then
        return {
            class = "amenity",
            subclass = "place_of_worship"
        }
    end

    -- amenity = townhall (pas de wikidata obligatoire)
    if tags.amenity == "townhall" then
        return {
            class = "amenity",
            subclass = "townhall"
        }
    end

    -- amenity = theatre + wikidata obligatoire
    if tags.amenity == "theatre" and tags.wikidata then
        return {
            class = "amenity",
            subclass = "theatre"
        }
    end

    return nil
end

-- Bridge filter handler
local function filter_bridge(tags)
    -- bridge = yes + wikidata obligatoire
    if tags.bridge and tags.wikidata then
        return {
            class = "bridge",
            subclass = tags.bridge
        }
    end
    return nil
end

-- Leisure filter handler
local function filter_leisure(tags)
    -- leisure = park + wikidata obligatoire
    if tags.leisure == "park" and tags.wikidata then
        return {
            class = "leisure",
            subclass = "park"
        }
    end

    -- leisure = marina (pas de wikidata obligatoire)
    if tags.leisure == "marina" then
        return {
            class = "leisure",
            subclass = "marina"
        }
    end

    return nil
end

-- Government filter handler
local function filter_government(tags)
    -- government + heritage ≤ 3
    if tags.government and tags.heritage then
        local heritage_num = tonumber(tags.heritage)
        if heritage_num and heritage_num <= 3 then
            return {
                class = "government",
                subclass = "heritage"
            }
        end
    end
    return nil
end

-- Landuse filter handler
local function filter_landuse(tags)
    -- landuse = cemetery + wikidata obligatoire
    if tags.landuse == "cemetery" and tags.wikidata then
        return {
            class = "landuse",
            subclass = "cemetery"
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
    leisure = filter_leisure,
    government = filter_government,
    landuse = filter_landuse
}

-- Main function to check if an OSM object matches POI criteria
function M.get_poi_data(tags)
    for tag_type, filter_func in pairs(poi_filters) do
        if tags[tag_type] then
            local poi_data = filter_func(tags)
            if poi_data then
                return poi_data
            end
        end
    end
    return nil
end

return M
