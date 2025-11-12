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
  async findUserZoneStats(
    userId: string,
    boundaryLevels: string[] = [
      "COUNTRY",
      "REGION",
      "COUNTY",
      "CITY",
      "DISTRICT",
      "NEIGHBORHOOD",
    ],
  ) {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- OK for extension
        validated_pois: any;
        total_pois_count: string;
        total_subzones_count: string;
        completed_subzones_count: string;
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
      ),
      -- 2. Pré-agrégation des POIs par zone pour optimiser les comptages
      zone_pois AS (
        SELECT 
          pb.boundary_id,
          COUNT(DISTINCT pb.poi_id) as total_pois_count
        FROM poi_boundaries pb
        GROUP BY pb.boundary_id
      ),
      -- 3. Pré-agrégation des sous-zones par parent
      zone_children AS (
        SELECT 
          b.parent_id,
          COUNT(*) as total_subzones_count,
          COUNT(rz.zone_id) as completed_subzones_count
        FROM boundaries b
        LEFT JOIN relevant_zones rz ON b.id = rz.zone_id
        WHERE b.parent_id IS NOT NULL
        GROUP BY b.parent_id
      )
      
      SELECT 
        b.id as zone_id,
        b.name,
        b.boundary_level,
        b.parent_id,
        
        -- Compte des POIs validés par l'utilisateur dans cette zone spécifique
        COUNT(DISTINCT vp.poi_id) as validated_pois_count,
        
        -- Récupération des détails complets des visited_pois (déjà en camelCase pour éviter le map)
        -- Fastify sérialise automatiquement les Date en ISO string via JSON.stringify
        -- jsonb_strip_nulls supprime les clés avec des valeurs null pour respecter le schéma TypeScript
        -- qui attend Type.Optional(Type.String()) (undefined) plutôt que null
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_strip_nulls(
              jsonb_build_object(
                'id', vp.id,
                'poiId', vp.poi_id,
                'name', pd.name,
                'createdAt', vp.created_at,
                'comment', vp.comment,
                'rating', vp.rating,
                'imageKey', vp.image_key
              )
            )
          ) FILTER (WHERE vp.id IS NOT NULL),
          '[]'::jsonb
        )::json as validated_pois,
        
        -- Nombre total de POIs dans cette zone spécifique (depuis la pré-agrégation)
        COALESCE(zp.total_pois_count::text, '0') as total_pois_count,
        
        -- Nombre total de sous-zones (enfants directs) depuis la pré-agrégation
        COALESCE(zc.total_subzones_count::text, '0') as total_subzones_count,
        
        -- Nombre de sous-zones complétées (enfants qui ont une activité) depuis la pré-agrégation
        COALESCE(zc.completed_subzones_count::text, '0') as completed_subzones_count
          
      FROM boundaries b
      -- On ne garde que les zones pertinentes (celles visitées ou leurs parents)
      JOIN relevant_zones rz ON b.id = rz.zone_id
      -- Jointures pour compter les POIs visités par l'utilisateur
      LEFT JOIN poi_boundaries pb ON b.id = pb.boundary_id
      LEFT JOIN visited_pois vp ON pb.poi_id = vp.poi_id AND vp.user_id = ${userId}
      -- LEFT JOIN avec poi_data pour éviter la sous-requête corrélée
      -- Utilisation de LATERAL JOIN pour sélectionner une seule entrée par poi_id (évite les doublons de langue)
      LEFT JOIN LATERAL (
        SELECT pd.name
        FROM poi_data pd
        WHERE pd.poi_id = vp.poi_id
        ORDER BY pd.language DESC, pd.id
        LIMIT 1
      ) pd ON true
      -- Jointures avec les CTEs pré-agrégés pour optimiser les comptages
      LEFT JOIN zone_pois zp ON b.id = zp.boundary_id
      LEFT JOIN zone_children zc ON b.id = zc.parent_id
      WHERE b.boundary_level = ANY(${boundaryLevels}::"BoundaryLevelEnum"[])
      -- Group by pour éviter les doublons
      GROUP BY b.id, b.name, b.boundary_level, b.parent_id, zp.total_pois_count, zc.total_subzones_count, zc.completed_subzones_count
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
      // Ensure validated_pois is always an array, never null or undefined
      validated_pois:
        stat.validated_pois !== null &&
        stat.validated_pois !== undefined &&
        Array.isArray(stat.validated_pois)
          ? stat.validated_pois
          : [],
      total_pois_count: Number(stat.total_pois_count),
      total_subzones_count: Number(stat.total_subzones_count),
      completed_subzones_count: Number(stat.completed_subzones_count),
    }));
  },
});
