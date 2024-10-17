import * as csvSync from "csv/sync";
import fs from "fs";
import ky from "ky";
import z from "zod";
import { config } from "../config";

const sourceFilePlaces = "csv-files/places-full-geoapify.csv";

const PlacesSchema = z.array(
  z.object({
    name: z.string(),
    description: z.string(),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
  }),
);

const places = PlacesSchema.parse(
  csvSync.parse(fs.readFileSync(sourceFilePlaces), {
    columns: true,
  }),
);

await Promise.all(
  places.map((place) => {
    return ky.post(`${config.STRAPI_BASE_URL}/api/places`, {
      json: {
        data: {
          title: place.name,
          description: place.description,
          hidden: false,
          mediaURL: undefined,
          position: {
            latitude: place.latitude,
            longitude: place.longitude,
          },
          note: undefined,
        },
      },
      headers: { Authorization: `Bearer ${config.STRAPI_API_KEY}` },
    });
  }),
);
