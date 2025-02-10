import { Prisma, PrismaClient } from "@prisma/client";
import { type Static } from "@sinclair/typebox";

import { type CreateVisitedPoiRequestSchema } from "../schemas/poi/visited-poi.js";
import { type PoiSourceEnum } from ".prisma/client";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- too complex to type
export const getPrismaExtendedClient = () => {
  const prismaExtendedClient = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  }).$extends({
    model: {
      poi: {
        async findInBoundingBox(boundingBox: {
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

          const pois = await prismaExtendedClient.$queryRaw<
            Array<{
              id: string;
              // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- SafeQL returns unknown | null
              longitude: unknown | null;
              // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- SafeQL returns unknown | null
              latitude: unknown | null;
            }>
          >` 
            SELECT id,
              ST_X(coords::geometry) as longitude,
              ST_Y(coords::geometry) as latitude
            FROM pois
            WHERE ST_Within(coords::geometry, ST_GeomFromText(${polygon}, 4326));
          `;

          return pois.map((poi) => ({
            id: poi.id,
            coords: {
              latitude: Number(poi.latitude),
              longitude: Number(poi.longitude),
            },
          }));
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
          data: Static<typeof CreateVisitedPoiRequestSchema> & {
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
