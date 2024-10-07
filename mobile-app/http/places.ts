import { apiClient } from "@/http/api-client";
import { z } from "zod";

const PlaceSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  hidden: z.boolean(),
  mediaURL: z.string().nullable(),
  note: z.number().nullable(),
  position: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});
const PlacesSchema = z.object({ data: z.array(PlaceSchema) });
export type PlaceType = z.infer<typeof PlaceSchema>;

export const getPlaces = async (
  accessToken: string | null,
): Promise<PlaceType[]> => {
  const rawResult = await apiClient(accessToken)
    .get("api/places", {
      searchParams: {
        "pagination[pageSize]": 1000,
        populate: "*",
      },
    })
    .json();
  return PlacesSchema.parse(rawResult).data;
};
