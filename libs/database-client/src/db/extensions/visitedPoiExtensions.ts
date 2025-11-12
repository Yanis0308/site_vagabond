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
});
