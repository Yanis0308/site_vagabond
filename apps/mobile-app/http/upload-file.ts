import {
  type FileInfo,
  UploadFileResponseSchema,
  validateWithSchema,
} from "@vagabond/shared-utils";

import { type UploadFileParams } from "@/hooks/mutations/useUploadFileMutation";
import { apiClient } from "@/http/api-client";

export const uploadFile = async (
  params: UploadFileParams,
): Promise<FileInfo> => {
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
  if (!validateWithSchema(UploadFileResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  return rawResult.data;
};
