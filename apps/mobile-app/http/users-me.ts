import { z } from "zod";

import { apiClient } from "@/http/api-client";

const UsersMeSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  // "createdAt": "2024-09-30T11:15:08.583Z",
});
export type UsersMeType = z.infer<typeof UsersMeSchema>;

export const getUsersMe = async (
  accessToken: string | null,
): Promise<UsersMeType> => {
  const rawResult = await apiClient(accessToken).get("api/users/me").json();
  return UsersMeSchema.parse(rawResult);
};
