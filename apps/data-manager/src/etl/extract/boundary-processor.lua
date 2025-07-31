-- Boundary processor for administrative boundaries
-- Handles processing and insertion of boundary objects into the boundaries table
local M = {}

-- Process a boundary object and prepare data for insertion
function M.process_boundary(tables, object, geom)
    local current_boundary = {
        name = object.tags.name,
        admin_level = object.tags.admin_level,
        wikidata = object.tags.wikidata,
        wikipedia = object.tags.wikipedia,
        geom = geom,
        tags = object.tags
    }

    tables.boundaries:insert(current_boundary)
end

return M
