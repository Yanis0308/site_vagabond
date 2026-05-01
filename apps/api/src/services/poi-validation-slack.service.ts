import type { FastifyInstance } from "fastify";

import { captureAndLog, getLogger } from "../utils/logger.js";

interface NotifyPoiValidatedInput {
  visitedPoiId: number;
  poiId: string;
  photoUrl: string;
  userDisplayName: string;
  userFullName: string;
  userEmail: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export async function notifyPoiValidatedOnSlack(
  fastify: FastifyInstance,
  input: NotifyPoiValidatedInput,
): Promise<void> {
  try {
    const poiInfo = await fastify.dbRepositories.poi.findByIdWithNameAndCoords(
      input.poiId,
    );

    if (poiInfo === null) {
      return;
    }

    const displayName = poiInfo.name.length > 0 ? poiInfo.name : "Lieu inconnu";
    const locationParts = [
      poiInfo.cityName,
      poiInfo.countyName,
      poiInfo.regionName,
    ].filter((x): x is string => x !== null && x.length > 0);
    const displayLocation =
      locationParts.length > 0 ? locationParts.join(", ") : "—";

    await fastify.slack.sendPoiValidationMessage({
      visitedPoiId: input.visitedPoiId,
      poiName: displayName,
      location: displayLocation,
      userDisplayName: input.userDisplayName,
      userFullName: input.userFullName,
      userEmail: input.userEmail,
      rating: input.rating,
      comment: input.comment,
      photoUrl: input.photoUrl,
      createdAt: input.createdAt,
    });

    getLogger(fastify).info(
      `Place validated: ${displayName} by ${input.userFullName} (${input.userId})`,
    );
  } catch (error) {
    captureAndLog(
      fastify,
      error,
      "Failed to send Slack notification for place validation",
      {
        level: "warning",
        tags: { operation: "slack-poi-validation" },
      },
    );
  }
}
