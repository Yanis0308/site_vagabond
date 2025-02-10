local pois = osm2pgsql.define_table({
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

local boundaries = osm2pgsql.define_table({
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

function process_poi(object, geom)
    local current_poi = {
        name = object.tags.name,
        wikidata = object.tags.wikidata,
        wikipedia = object.tags.wikipedia,
        geom = geom,
        tags = object.tags
    }

    -- Table de correspondance pour les types de POI
    local poi_types = {
        tourism = function(tags)
            return {
                class = "tourism",
                subclass = tags.tourism
            }
        end,
        historic = function(tags)
            return {
                class = "historic",
                subclass = tags.historic
            }
        end,
        leisure = function(tags)
            if tags.leisure == "park" then
                return {
                    class = "leisure",
                    subclass = tags.leisure
                }
            end
            return nil
        end,
        amenity = function(tags)
            if tags.amenity == "place_of_worship" then
                return {
                    class = "amenity",
                    subclass = tags.amenity
                }
            end
            return nil
        end
    }

    -- Parcourir les types possibles et insérer si correspondant
    for tag_type, handler in pairs(poi_types) do
        if object.tags[tag_type] then
            local poi_data = handler(object.tags)
            if poi_data then
                current_poi.class = poi_data.class
                current_poi.subclass = poi_data.subclass
                pois:insert(current_poi)
                break -- Arrêt au premier match
            end
        end
    end
end

function process_boundary(object, geom)
    local current_boundary = {
        name = object.tags.name,
        admin_level = object.tags.admin_level,
        wikidata = object.tags.wikidata,
        wikipedia = object.tags.wikipedia,
        geom = geom,
        tags = object.tags
    }

    boundaries:insert(current_boundary)
end

function osm2pgsql.process_node(object)
    process_poi(object, object:as_point())
end

function osm2pgsql.process_way(object)
    if object.tags.boundary == 'administrative' and object.tags.admin_level then
        process_boundary(object, object:as_polygon())
    elseif object.is_closed then
        process_poi(object, object:as_polygon():centroid())
    end
end

function osm2pgsql.process_relation(object)
    if object.tags.boundary == 'administrative' and object.tags.admin_level then
        if object.tags.type == 'boundary' then
            local geom = object:as_multipolygon()
            -- we could iterate over all members of multipolygon if preferred
            if geom then
                process_boundary(object, geom)
            end
        end
    else
        process_poi(object, object:as_multipolygon():centroid())
    end
end
