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
