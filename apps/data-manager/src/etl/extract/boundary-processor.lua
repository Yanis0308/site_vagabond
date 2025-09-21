-- Boundary processor for administrative boundaries
-- Handles processing and insertion of boundary objects into the boundaries table
-- Also detects admin_centre members for later processing
local M = {}

-- Note: admin_centre members are now stored in boundary tags for association in transform.ts

-- Process a boundary object and prepare data for insertion
function M.process_boundary(tables, object, geom)
    -- Convertir admin_level string vers integer
    local admin_level_int = tonumber(object.tags.admin_level)
    if not admin_level_int then
        print("Warning: Invalid admin_level '" .. tostring(object.tags.admin_level) .. "' for boundary " ..
                  tostring(object.id) .. " - skipping")
        return -- Ignorer si admin_level n'est pas un nombre valide
    end

    -- Chercher les membres admin_centre dans la relation
    local admin_centre_members = {}

    if object.members then
        for _, member in ipairs(object.members) do
            if member.role == "admin_centre" then
                -- Stocker les infos du membre admin_centre
                table.insert(admin_centre_members, {
                    type = member.type,
                    ref = member.ref
                })
                print("Found admin_centre for boundary " .. tostring(object.id) .. ": " .. member.type .. " " ..
                          tostring(member.ref))
            end
        end
    end

    -- Préparer les données admin_centre_members pour la colonne séparée
    local admin_centre_members_json = nil
    if #admin_centre_members > 0 then
        -- Encoder en JSON (simple pour ce cas d'usage)
        local json_parts = {}
        for _, member in ipairs(admin_centre_members) do
            table.insert(json_parts, '{"type":"' .. member.type .. '","ref":' .. tostring(member.ref) .. '}')
        end
        admin_centre_members_json = '[' .. table.concat(json_parts, ',') .. ']'
        print("Stored admin_centre_members for boundary " .. tostring(object.id) .. ": " .. admin_centre_members_json)
    end

    local current_boundary = {
        name = object.tags.name,
        admin_level = admin_level_int,
        geom = geom,
        admin_centre_members = admin_centre_members_json,
        tags = object.tags
    }

    tables.boundaries:insert(current_boundary)
end

return M
