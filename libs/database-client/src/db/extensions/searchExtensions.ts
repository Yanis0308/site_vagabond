import { Prisma } from "../generated/client/index.js";
import { type BasePrismaClient } from "../prismaExtendedClient.js";

export const createSearchExtensions = (
  prismaExtendedClient: BasePrismaClient,
  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for extension
) => ({
  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for extension
  async searchPoisAndCities(query: string) {
    /* eslint-disable @ts-safeql/check-sql -- disable linting for this query */
    // Escape single quotes for SQL injection prevention
    const escapedQuery = query.replace(/'/g, "''");
    const results = await prismaExtendedClient.$queryRaw<
      Array<{
        type: "POI" | "CITY";
        id: string;
        name: string | null;
        latitude: unknown | null;
        longitude: unknown | null;
        cityName: string | null;
        departmentName: string | null;
      }>
    >`
      SELECT * FROM (
        (
          SELECT
            'POI' as type,
            p.id,
            pd.name,
            ST_Y(p.coords::geometry) as latitude,
            ST_X(p.coords::geometry) as longitude,
            (
              SELECT city_b.name
              FROM poi_boundaries pb2
              INNER JOIN boundaries city_b ON pb2.boundary_id = city_b.id
              WHERE pb2.poi_id = p.id
                AND city_b.boundary_level = 'CITY'
              LIMIT 1
            ) as "cityName",
            NULL as "departmentName",
            POSITION(normalize_search_text(${Prisma.raw(`'${escapedQuery}'`)}) IN normalize_search_text(pd.name)) as relevance_score
          FROM pois p
          INNER JOIN poi_data pd ON p.id = pd.poi_id
          WHERE normalize_search_text(pd.name) LIKE '%' || normalize_search_text(${Prisma.raw(`'${escapedQuery}'`)}) || '%'
            AND p.disabled = false
          LIMIT 20
        )
        UNION ALL
        (
          SELECT
            'CITY' as type,
            b.id,
            b.name,
            ST_Y(b.display_point::geometry) as latitude,
            ST_X(b.display_point::geometry) as longitude,
            NULL as "cityName",
            dept_boundary.name as "departmentName",
            POSITION(normalize_search_text(${Prisma.raw(`'${escapedQuery}'`)}) IN normalize_search_text(b.name)) as relevance_score
          FROM boundaries b
          LEFT JOIN boundaries dept_boundary ON b.parent_id = dept_boundary.id
            AND dept_boundary.boundary_level = 'COUNTY'
          WHERE normalize_search_text(b.name) LIKE '%' || normalize_search_text(${Prisma.raw(`'${escapedQuery}'`)}) || '%'
            AND b.boundary_level = 'CITY'
          LIMIT 20
        )
      ) combined_results
      ORDER BY
        CASE WHEN type = 'CITY' THEN 0 ELSE 1 END,
        relevance_score ASC,
        name ASC
      LIMIT 20;
    `;
    /* eslint-enable @ts-safeql/check-sql -- re-enable linting */

    return results
      .filter(
        (result) =>
          result.name !== null &&
          result.latitude !== null &&
          result.longitude !== null,
      )
      .map((result) => {
        const baseResult: {
          type: "POI" | "CITY";
          id: string;
          name: string;
          coordinates: { latitude: number; longitude: number };
          cityName?: string;
          departmentName?: string;
        } = {
          type: result.type,
          id: result.id,
          name: result.name ?? "",
          coordinates: {
            latitude: Number(result.latitude),
            longitude: Number(result.longitude),
          },
        };

        // Add optional properties only if they exist
        if (result.cityName !== null && result.cityName !== undefined) {
          baseResult.cityName = result.cityName;
        }

        if (
          result.departmentName !== null &&
          result.departmentName !== undefined
        ) {
          baseResult.departmentName = result.departmentName;
        }

        return baseResult;
      });
  },
});
