import { type Static } from "@sinclair/typebox";
import { type jsonSchemas } from "@vagabond/shared-utils";

import { type BasePrismaClient } from "../prismaExtendedClient.js";

export const createVisitedPoiExtensions = (
  prismaExtendedClient: BasePrismaClient,
  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for extension
) => ({
  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for extension
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

  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for extension
  async findManyWithZones(userId: string) {
    return await prismaExtendedClient.$queryRaw<
      Array<{
        id: number;
        poi_id: string;
        user_id: string;
        created_at: Date;
        rating: number;
        comment: string;
        image_key: string;
        full_name: string | null;
        email: string | null;
        zone_id: string | null;
      }>
    >`SELECT DISTINCT ON (vp.id)
        vp.id,
        vp.poi_id,
        vp.user_id,
        vp.created_at,
        vp.rating,
        vp.comment,
        vp.image_key,
        u.full_name,
        u.email,
        pb.boundary_id as zone_id
      FROM visited_pois vp
      LEFT JOIN users u ON vp.user_id = u.user_id
      LEFT JOIN poi_boundaries pb ON vp.poi_id = pb.poi_id
      WHERE vp.user_id = ${userId}
      ORDER BY vp.id, pb.boundary_id
    `;
  },
});
