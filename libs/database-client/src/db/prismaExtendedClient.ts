import { type Static } from "@sinclair/typebox";
import { type jsonSchemas } from "@vagabond/shared-utils";

import {
  type PoiSourceEnum,
  Prisma,
  PrismaClient,
} from "./generated/client/index.js";

/* eslint-disable @typescript-eslint/array-type -- conflict with @ts-safeql/check-sql */

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- too complex to type
export const getPrismaExtendedClient = (withQueryLog = false) => {
  const prismaExtendedClient = new PrismaClient({
    log: withQueryLog
      ? ["info", "warn", "error", "query"]
      : ["info", "warn", "error"],
  }).$extends({
    model: {
      poi: {
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
              data:
                | {
                    id: number | null;
                    name: string | null;
                    description: string | null;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SafeQL generated type
                    rawInfo: any | null;
                    language: "EN" | "FR" | null;
                    dataSource: "OSM" | "AI" | "CUSTOM" | null;
                    createdAt: unknown | null;
                    updatedAt: unknown | null;
                  }[]
                | null;
              visitedPois:
                | {
                    id: number | null;
                    poiId: string | null;
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
            WHERE ST_Within(p.coords::geometry, ST_GeomFromText(${polygon}, 4326))
            AND p.disabled = false
            GROUP BY p.id
            LIMIT 1000;`;

          //TODO: au lieu de cast on pourrait utiliser une validation en JS mais cela ajouterait du runtime
          return poisWithData as unknown as Array<{
            id: string;
            coords: {
              latitude: number;
              longitude: number;
            };
            data: {
              id: number;
              name: string;
              description: string;
              rawInfo: Record<string, unknown>;
              language: "EN" | "FR";
              dataSource: "OSM" | "AI" | "CUSTOM";
              createdAt: string;
              updatedAt: string;
            }[];
            visitedPois: {
              id: number;
              poiId: string;
              userId: string;
              username: string;
              createdAt: string;
              comment: string;
              imageKey: string;
              rating: number;
            }[];
          }>;
        },
        async createManyCustom(
          data: Array<{
            id: string;
            source: PoiSourceEnum;
            sourceId: string;
            coords: {
              latitude: number;
              longitude: number;
            };
          }>,
        ) {
          /* eslint-disable @ts-safeql/check-sql -- disable linting for this query */
          return await prismaExtendedClient.$executeRaw`
            INSERT INTO pois (id, source, source_id, coords)
            VALUES ${Prisma.join(
              data.map((item) => {
                const point = `POINT(${item.coords.longitude} ${item.coords.latitude})`;
                return Prisma.sql`(${item.id}, CAST(${item.source} AS "PoiSourceEnum"), ${item.sourceId}, ST_GeomFromText(${point}, 4326))`;
              }),
            )};
          `;
          /* eslint-enable @ts-safeql/check-sql -- re-enable linting */
        },
        async manyDisable(ids: string[], reason: string) {
          return await prismaExtendedClient.poi.updateMany({
            where: { id: { in: ids } },
            data: { disabled: true, disabledReason: reason },
          });
        },
      },
      poiData: {
        async findDuplicatesByMhsRef() {
          return await prismaExtendedClient.$queryRaw<
            Array<{ poi_id: string }>
          >`
            WITH duplicate_mhs AS (
              SELECT 
                pd.raw_info->>'ref:mhs' as mhs_ref
              FROM poi_data pd
              WHERE 
                pd.raw_info->>'ref:mhs' IS NOT NULL 
                AND pd.raw_info->>'ref:mhs' != ''
              GROUP BY pd.raw_info->>'ref:mhs'
              HAVING COUNT(DISTINCT pd.poi_id) > 1
            ),
            
          ranked_pois AS (
            SELECT 
              p.id,
              pd.raw_info->>'ref:mhs' as mhs_ref,
              ROW_NUMBER() OVER (PARTITION BY pd.raw_info->>'ref:mhs' ORDER BY p.id) as rn
            FROM pois p
            JOIN poi_data pd ON p.id = pd.poi_id
            WHERE pd.raw_info->>'ref:mhs' IN (SELECT mhs_ref FROM duplicate_mhs)
            )

            SELECT id as "poi_id" 
            FROM ranked_pois
            WHERE rn > 1;`;
        },
      },
      visitedPoi: {
        async createCustom(
          data: Static<typeof jsonSchemas.CreateVisitedPoiRequestSchema> & {
            userId: string;
            poiId: string;
          },
        ) {
          const point = `POINT(${data.coords.longitude} ${data.coords.latitude})`;

          return await prismaExtendedClient.$executeRaw`
            INSERT INTO visited_pois (poi_id, user_id, image_key, rating, comment, coords)
            VALUES (
              ${data.poiId}, 
              ${data.userId}, 
              ${data.imageKey},
              ${data.rating},
              ${data.comment},
              ST_GeomFromText(${point}, 4326)
            );
          `;
        },
      },
    },
  });

  return prismaExtendedClient;
};

/* eslint-enable @typescript-eslint/array-type -- re-enable linting */
