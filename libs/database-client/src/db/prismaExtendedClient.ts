import { type Static } from "@sinclair/typebox";
import { type jsonSchemas } from "@vagabond/shared-utils";

import {
  type PoiSourceEnum,
  Prisma,
  PrismaClient,
} from "./generated/client/index.js";

/* eslint-disable @typescript-eslint/array-type -- conflict with @ts-safeql/check-sql */

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- too complex to type
export const getPrismaExtendedClient = () => {
  const prismaExtendedClient = new PrismaClient({
    log: ["query", "info", "warn", "error"],
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
            }>
          >`SELECT 
              p.id,
              json_build_object(
                'longitude', ST_X(p.coords::geometry),
                'latitude', ST_Y(p.coords::geometry)
              ) as coords,
              json_agg (
                json_build_object(
                  'id', pd.id,
                  'name', pd.name,
                  'description', pd.description,
                  'rawInfo', pd.raw_info,
                  'language', pd.language,
                    'dataSource', pd.source,
                    'createdAt', to_char(pd.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                    'updatedAt', to_char(pd.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                )
              ) AS data
            FROM pois p
            LEFT JOIN poi_data pd ON p.id = pd.poi_id
            WHERE ST_Within(p.coords::geometry, ST_GeomFromText(${polygon}, 4326))
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
      },
      visitedPoi: {
        async createCustom(
          data: Static<typeof jsonSchemas.CreateVisitedPoiRequestSchema> & {
            userId: string;
          },
        ) {
          const point = `POINT(${data.coords.longitude} ${data.coords.latitude})`;

          return await prismaExtendedClient.$executeRaw`
            INSERT INTO visited_pois (poi_id, user_id, coords)
            VALUES (
              ${data.poiId}, 
              ${data.userId}, 
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
