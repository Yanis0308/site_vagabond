import { Prisma } from "../generated/client/index.js";
import { type BasePrismaClient } from "../prismaExtendedClient.js";
import type { CustomPoiCreateInput } from "../types.js";

export const createPoiExtensions = (
  prismaExtendedClient: BasePrismaClient,
  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for extension
) => ({
  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for extension
  async findInBoundingBoxWithData(boundingBox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) {
    const polygon = `POLYGON((
      ${boundingBox.minLng} ${boundingBox.minLat},
      ${boundingBox.maxLng} ${boundingBox.minLat},
      ${boundingBox.maxLng} ${boundingBox.maxLat},
      ${boundingBox.minLng} ${boundingBox.maxLat},
      ${boundingBox.minLng} ${boundingBox.minLat}
    ))`;

    const poisWithData = await prismaExtendedClient.$queryRaw<
      Array<{
        id: string;
        coords: { longitude: unknown | null; latitude: unknown | null };
        data: // eslint-disable-next-line @typescript-eslint/array-type -- OK for extension
        | {
              id: number | null;
              name: string | null;
              description: string | null;
              filterLevel:
                | "UNKNOWN"
                | "STRICT"
                | "STANDARD"
                | "INTERMEDIATE"
                | "LAXIST";
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- OK for extension
              rawInfo: any | null;
              language: "EN" | "FR" | null;
              dataSource: "OSM" | "AI" | "CUSTOM" | null;
              createdAt: unknown | null;
              updatedAt: unknown | null;
            }[]
          | null;
        visitedPois: // eslint-disable-next-line @typescript-eslint/array-type -- OK for extension
        | {
              id: number | null;
              poiId: string | null;
              zoneId: string | null;
              userId: string | null;
              username: unknown | null | string;
              createdAt: unknown | null;
              comment: string | null;
              imageKey: string | null;
              rating: number | null;
            }[]
          | null;
      }>
    >`SELECT 
        p.id,
        jsonb_build_object(
          'longitude', ST_X(p.coords::geometry),
          'latitude', ST_Y(p.coords::geometry)
        ) as coords,
        json_agg (
          DISTINCT jsonb_build_object(
            'id', pd.id,
            'name', pd.name,
            'description', pd.description,
            'filterLevel', p.filter_level,
            'rawInfo', pd.raw_info,
            'language', pd.language,
              'dataSource', pd.source,
              'createdAt', to_char(pd.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
              'updatedAt', to_char(pd.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          )
        ) FILTER (WHERE pd.id IS NOT NULL) AS data,
        json_agg (
          DISTINCT jsonb_build_object(
            'id', vp.id,
            'poiId', vp.poi_id,
            'zoneId', pb.boundary_id,
            'userId', vp.user_id,
            'username', CASE 
              WHEN u.email IS NOT NULL AND POSITION('@' IN u.email) > 0 THEN 
                SUBSTRING(u.email FROM 1 FOR POSITION('@' IN u.email) - 1)
              ELSE 'John Doe'
            END,
            'createdAt', to_char(vp.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'comment', vp.comment,
            'imageKey', vp.image_key,
            'rating', vp.rating
          )
        ) FILTER (WHERE vp.id IS NOT NULL) AS "visitedPois"
      FROM pois p
      LEFT JOIN poi_data pd ON p.id = pd.poi_id
      LEFT JOIN visited_pois vp ON p.id = vp.poi_id
      LEFT JOIN users u ON vp.user_id = u.user_id
      LEFT JOIN poi_boundaries pb ON p.id = pb.poi_id
      WHERE ST_Within(p.coords::geometry, ST_GeomFromText(${polygon}, 4326))
      AND p.disabled = false
      GROUP BY p.id
      LIMIT 10000;`;

    //TODO: au lieu de cast on pourrait utiliser une validation en JS mais cela ajouterait du runtime
    return poisWithData as unknown as Array<{
      id: string;
      coords: {
        latitude: number;
        longitude: number;
      };
      data: Array<{
        id: number;
        name: string;
        description: string;
        filterLevel:
          | "UNKNOWN"
          | "STRICT"
          | "STANDARD"
          | "INTERMEDIATE"
          | "LAXIST";
        rawInfo: Record<string, unknown>;
        language: "EN" | "FR";
        dataSource: "OSM" | "AI" | "CUSTOM";
        createdAt: string;
        updatedAt: string;
      }>;
      visitedPois: Array<{
        id: number;
        poiId: string;
        zoneId: string;
        userId: string;
        username: string;
        createdAt: string;
        comment: string;
        imageKey: string;
        rating: number;
      }>;
    }>;
  },

  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for extension
  async createManyCustom(data: CustomPoiCreateInput[]) {
    /* eslint-disable @ts-safeql/check-sql -- disable linting for this query */
    return await prismaExtendedClient.$executeRaw`
      INSERT INTO pois (id, source, source_id, coords, filter_level)
      VALUES ${Prisma.join(
        data.map((item) => {
          const point = `POINT(${item.coords.longitude} ${item.coords.latitude})`;
          return Prisma.sql`(${item.id}, CAST(${item.source} AS "PoiSourceEnum"), ${item.sourceId}, ST_GeomFromText(${point}, 4326), CAST(${item.filterLevel} AS "PoiFilterLevelEnum"))`;
        }),
      )}
      ON CONFLICT (source, source_id) DO NOTHING;
    `;
    /* eslint-enable @ts-safeql/check-sql -- re-enable linting */
  },

  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for extension
  async manyDisable(ids: string[], reason: string) {
    return await prismaExtendedClient.poi.updateMany({
      where: { id: { in: ids } },
      data: { disabled: true, disabledReason: reason },
    });
  },
});
