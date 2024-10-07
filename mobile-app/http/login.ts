import { apiClient } from "@/http/api-client";
import { z } from "zod";

const UserAuthInfoSchema = z.object({ jwt: z.string() });
type UserAuthInfo = z.infer<typeof UserAuthInfoSchema>;

export const loginWithGoogle = async (
  accessToken: string,
): Promise<UserAuthInfo> => {
  const rawResult = await apiClient(null)
    .get("api/auth/google/callback", {
      searchParams: { access_token: accessToken },
    })
    .json();
  console.log("data", JSON.stringify(rawResult));
  return UserAuthInfoSchema.parse(rawResult);
};
