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
});
