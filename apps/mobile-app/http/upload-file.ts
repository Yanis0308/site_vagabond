import { type Static } from "@sinclair/typebox";
import { generateValidator, jsonSchemas } from "@vagabond/shared-utils";

import { type UploadFileParams } from "@/hooks/mutations/useUploadFileMutation";
import { apiClient } from "@/http/api-client";

const validateResponse = generateValidator(
  jsonSchemas.UploadFileResponseSchema,
);

export const uploadFile = async (
  params: UploadFileParams,
): Promise<Static<typeof jsonSchemas.FileInfoSchema>> => {
  const formData = new FormData();
  //@ts-expect-error fix this later
  formData.append("file", {
    uri: params.uri,
    name: params.fileName,
    type: params.mimeType,
  });
  const rawResult = await apiClient
    .post("api/upload", { body: formData })
    .json();
  if (!validateResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
