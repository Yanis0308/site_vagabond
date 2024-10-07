import { apiClient } from "@/http/api-client";
import { z } from "zod";

export type ValidatePlaceCreate = {
  place: string;
  users_permissions_user: number;
  position: {
    latitude: number;
    longitude: number;
  };
  photo: number;
};

export const validatePlace = async (
  accessToken: string | null,
  data: ValidatePlaceCreate,
): Promise<void> => {
  const rawResult = await apiClient(accessToken)
    .post("api/validated-places", { json: { data } })
    .json();
  console.log("=== validate place result:", JSON.stringify(rawResult));
};

const PhotoFormat = z.object({
  url: z.string(),
});
const ValidatedPlaceSchema = z.object({
  // createdAt: "2024-10-04T16:52:31.196Z",
  photo: z.object({
    formats: z.object({
      large: PhotoFormat,
      small: PhotoFormat,
      medium: PhotoFormat,
      thumbnail: PhotoFormat,
    }),
    url: z.string(),
  }),
  place: z.object({
    id: z.number(),
  }),
});
const ValidatedPlacesSchema = z.object({ data: z.array(ValidatedPlaceSchema) });
export type ValidatedPlaceType = z.infer<typeof ValidatedPlaceSchema>;

export const getValidatedPlaces = async (
  accessToken: string | null,
  userId: number,
): Promise<ValidatedPlaceType[]> => {
  const rawResult = await apiClient(accessToken)
    .get("api/validated-places", {
      searchParams: {
        "pagination[pageSize]": 1000,
        populate: "*",
        "filters[users_permissions_user][id][$eq]": userId,
      },
    })
    .json();
  return ValidatedPlacesSchema.parse(rawResult).data;
};
