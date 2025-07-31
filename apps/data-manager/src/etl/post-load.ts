import { getPrismaExtendedClient } from "@vagabond/database-client";
import { logger } from "@vagabond/shared-utils";

export async function postLoad(): Promise<void> {
  logger.info(`Post load started`);

  const prismaExtendedClient = getPrismaExtendedClient();
  await prismaExtendedClient.$connect();

  try {
    // await disableMhsDuplicates(prismaExtendedClient);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error during post load:", error);
    }
    throw error;
  } finally {
    await prismaExtendedClient.$disconnect();
    logger.info("Post load ended");
  }
}

async function disableMhsDuplicates(
  prismaExtendedClient: ReturnType<typeof getPrismaExtendedClient>,
): Promise<void> {
  logger.info("Post load step started: Disable MHS duplicates");

  const duplicates =
    await prismaExtendedClient.poiData.findDuplicatesByMhsRef();
  await prismaExtendedClient.poi.manyDisable(
    duplicates.map((d) => d.poi_id),
    "duplicate_mhs_reference",
  );

  logger.info("Post load step ended: Disable MHS duplicates");
}

