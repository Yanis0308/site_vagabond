import { type BasePrismaClient } from "../prismaExtendedClient.js";

export const createBoundaryExtensions = (
  prismaExtendedClient: BasePrismaClient,
  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for extension
) => ({
  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for extension
  async findAllZones() {
    const zoneStats = await prismaExtendedClient.$queryRaw<
      Array<{
        zone_id: string;
        name: string | null;
        point: { longitude: unknown | null; latitude: unknown | null };
        boundary_level:
          | "COUNTRY"
          | "REGION"
          | "COUNTY"
          | "CITY"
          | "DISTRICT"
          | "NEIGHBORHOOD";
        place_type: string;
        population: number;
        is_capital: boolean;
        importance_score: number;
        way_area: number;
        parent_id: string | null;
        total_pois: string;
      }>
    >`SELECT 
        b.id as zone_id,
        b.name,
        jsonb_build_object(
          'longitude', ST_X(b.display_point::geometry),
          'latitude', ST_Y(b.display_point::geometry)
        ) as point,
        b.boundary_level,
        b.place_type,
        b.population,
        b.is_capital,
        b.importance_score,
        b.way_area,
        b.parent_id,
        COUNT(DISTINCT pb.poi_id) as total_pois
      FROM boundaries b
      LEFT JOIN poi_boundaries pb ON b.id = pb.boundary_id
      GROUP BY b.id
      ORDER BY COALESCE(b.way_area, 0) DESC;
    `;

    // Transform the data to ensure proper types
    return zoneStats.map((stat) => ({
      zone_id: stat.zone_id,
      name: stat.name,
      point: {
        latitude: Number(stat.point.latitude),
        longitude: Number(stat.point.longitude),
      },
      total_pois: Number(stat.total_pois),
      boundary_level: stat.boundary_level,
      place_type: stat.place_type,
      population: stat.population,
      is_capital: stat.is_capital,
      importance_score: stat.importance_score,
      way_area: stat.way_area,
      parent_id: stat.parent_id,
    }));
  },

  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for extension
  async findUserZoneStats(userId: string) {
    const userZoneStats = await prismaExtendedClient.$queryRaw<
      Array<{
        zone_id: string;
        name: string | null;
        boundary_level:
          | "COUNTRY"
          | "REGION"
          | "COUNTY"
          | "CITY"
          | "DISTRICT"
          | "NEIGHBORHOOD";
        parent_id: string | null;
        validated_pois_count: string;
        total_pois_count: unknown;
        total_subzones_count: unknown;
        completed_subzones_count: unknown;
      }>
    >`
      WITH RECURSIVE 
      -- 1. Obtenir toutes les zones (feuilles + ancêtres) où l'utilisateur a une activité.
      relevant_zones AS (
        -- Zones avec une validation directe de POI
        SELECT DISTINCT pb.boundary_id as zone_id
        FROM visited_pois vp
        JOIN poi_boundaries pb ON vp.poi_id = pb.poi_id
        WHERE vp.user_id = ${userId}
        
        UNION
        
        -- Zones ancêtres (remontée récursive)
        SELECT b.parent_id
        FROM relevant_zones rz
        JOIN boundaries b ON rz.zone_id = b.id
        WHERE b.parent_id IS NOT NULL
      )
      
      SELECT 
        b.id as zone_id,
        b.name,
        b.boundary_level,
        b.parent_id,
        
        -- Compte des POIs validés par l'utilisateur dans cette zone spécifique
        COUNT(DISTINCT vp.poi_id) as validated_pois_count,
        
        -- Nombre total de POIs dans cette zone spécifique
        (SELECT COUNT(DISTINCT pb_total.poi_id) 
         FROM poi_boundaries pb_total 
         WHERE pb_total.boundary_id = b.id) as total_pois_count,
        
        -- Nombre total de sous-zones (enfants directs)
        (SELECT COUNT(*) 
         FROM boundaries c 
         WHERE c.parent_id = b.id) as total_subzones_count,
        
        -- Nombre de sous-zones complétées (enfants qui ont une activité)
        (SELECT COUNT(*) 
         FROM boundaries child
         JOIN relevant_zones rz_child ON child.id = rz_child.zone_id
         WHERE child.parent_id = b.id) as completed_subzones_count
          
      FROM boundaries b
      -- On ne garde que les zones pertinentes (celles visitées ou leurs parents)
      JOIN relevant_zones rz ON b.id = rz.zone_id
      -- Jointures pour compter les POIs visités par l'utilisateur
      LEFT JOIN poi_boundaries pb ON b.id = pb.boundary_id
      LEFT JOIN visited_pois vp ON pb.poi_id = vp.poi_id AND vp.user_id = ${userId}
      -- Group by pour éviter les doublons
      GROUP BY b.id, b.name, b.boundary_level, b.parent_id
      -- Tri par niveau hiérarchique
      ORDER BY 
        CASE boundary_level
          WHEN 'COUNTRY' THEN 1
          WHEN 'REGION' THEN 2  
          WHEN 'COUNTY' THEN 3
          WHEN 'CITY' THEN 4
          WHEN 'DISTRICT' THEN 5
          WHEN 'NEIGHBORHOOD' THEN 6
        END,
        name;
    `;

    // Transform the data to ensure proper types
    return userZoneStats.map((stat) => ({
      zone_id: stat.zone_id,
      name: stat.name ?? "Unknown",
      boundary_level: stat.boundary_level,
      parent_id: stat.parent_id,
      validated_pois_count: Number(stat.validated_pois_count),
      total_pois_count: Number(stat.total_pois_count),
      total_subzones_count: Number(stat.total_subzones_count),
      completed_subzones_count: Number(stat.completed_subzones_count),
    }));
  },
});
