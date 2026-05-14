import {
  type RegisterPushDeviceRequest,
  RegisterPushDeviceResponseSchema,
  validateWithSchema,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";

export const registerPushDevice = async (
  payload: RegisterPushDeviceRequest,
): Promise<{ id: number }> => {
  const rawResult = await apiClient
    .post("api/push-devices", { json: payload })
    .json();

  if (!validateWithSchema(RegisterPushDeviceResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};

export const deregisterPushDevice = async (token: string): Promise<void> => {
  await apiClient.delete("api/push-devices", {
    json: { token },
  });
};
