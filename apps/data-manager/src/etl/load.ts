import { getPrismaExtendedClient } from "@vagabond/database-client";
import {
  LanguageEnum,
  type PoiFilterLevelEnum,
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
        filterLevel: getFilterLevel(item),
      };
    });

    const poiDatasToSave: Prisma.PoiDataUncheckedCreateInput[] = data.map(
      (item) => {
        return {
          name: item.tags.name ?? "",
          description: item.tags.description ?? "",
          rawInfo: item.tags,
          nbOfTags: Object.keys(item.tags).length,
          source: PoiSourceEnum.OSM,
          sourceId: getComputedId(item),
          language: LanguageEnum.FR,
          poiId: getSourceId(PoiSourceEnum.OSM, getComputedId(item)),
        };
      },
    );

    await prismaExtendedClient.poi.createManyCustom(poisToSave);
    await prismaExtendedClient.poiData.createMany({
      data: poiDatasToSave,
      skipDuplicates: true,
    });

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

function getFilterLevel(item: ExtractedPoiDatabaseRow): PoiFilterLevelEnum {
  switch (item.filter_level) {
    case 1:
      return "STRICT";
    case 2:
      return "STANDARD";
    case 3:
      return "INTERMEDIATE";
    case 4:
      return "LAXIST";
    default:
      return "UNKNOWN";
  }
}
