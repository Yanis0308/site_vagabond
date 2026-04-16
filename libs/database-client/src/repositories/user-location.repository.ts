import { sql } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { userLocations } from "../schema.js";

export interface CoordsInput {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface LocationInput extends CoordsInput {
  userId: string;
  timestamp: Date;
}

export class UserLocationRepository {
  constructor(private readonly db: DrizzleClient) {}

  /**
   * Insert a new user location
   */
  async insertLocation(input: LocationInput): Promise<void> {
    await this.db.insert(userLocations).values({
      userId: input.userId,
      coords: sql`ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)`,
      accuracy: input.accuracy,
      altitude: input.altitude,
      altitudeAccuracy: input.altitudeAccuracy,
      heading: input.heading,
      speed: input.speed,
      timestamp: input.timestamp,
    });
  }
}
