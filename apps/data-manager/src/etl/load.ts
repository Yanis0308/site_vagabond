import { getPrismaExtendedClient } from "@vagabond/database-client";
import {
  LanguageEnum,
  PoiSourceEnum,
  type Prisma,
} from "@vagabond/database-client/dist/db/generated/client";
import { logger } from "@vagabond/shared-utils";

import { type ExtractedPoiDatabaseRow } from "./transform";

export async function load(data: ExtractedPoiDatabaseRow[]): Promise<void> {
  const prismaExtendedClient = getPrismaExtendedClient();
  await prismaExtendedClient.$connect();

  try {
    const poisToSave = data.map((item) => {
      const computedId = getComputedId(item);
      return {
        id: getSourceId(PoiSourceEnum.OSM, computedId),
        source: PoiSourceEnum.OSM,
        sourceId: computedId,
        coords: {
          latitude: item.latitude,
          longitude: item.longitude,
        },
      };
    });

    const poiDatasToSave: Prisma.PoiDataUncheckedCreateInput[] = data.map(
      (item) => {
        return {
          name: item.tags.name ?? "",
          description: item.tags.description ?? "",
          rawInfo: item.tags,
          source: PoiSourceEnum.OSM,
          sourceId: getComputedId(item),
          language: LanguageEnum.FR,
          poiId: getSourceId(PoiSourceEnum.OSM, getComputedId(item)),
        };
      },
    );

    await prismaExtendedClient.poi.createManyCustom(poisToSave);
    await prismaExtendedClient.poiData.createMany({ data: poiDatasToSave });

    logger.info(`Lot de ${data.length} lignes inséré avec succès`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Erreur lors du traitement du lot:", error);
    }
    throw error;
  } finally {
    await prismaExtendedClient.$disconnect();
  }
}

function getComputedId(item: ExtractedPoiDatabaseRow): string {
  return `${item.osm_type}-${item.osm_id}`;
}

function getSourceId(source: PoiSourceEnum, computedId: string): string {
  return `${source}-${computedId}`;
}
