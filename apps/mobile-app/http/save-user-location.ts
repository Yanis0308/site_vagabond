import { type UserLocationRequest } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";

export const saveUserLocation = async (
  location: UserLocationRequest,
): Promise<void> => {
  await apiClient.post("api/location", {
    json: location,
  });
};
