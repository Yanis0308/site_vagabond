import { z } from "zod";

import { type UploadFileParams } from "@/hooks/mutations/useUploadFileMutation";
import { apiClient } from "@/http/api-client";

const UploadFileResultSchema = z
  .array(
    z.object({
      id: z.number(),
    }),
  )
  .nonempty();

type UploadFileResult = z.infer<typeof UploadFileResultSchema>;

export const uploadFile = async (
  params: UploadFileParams,
): Promise<UploadFileResult> => {
  const formData = new FormData();
  //@ts-expect-error fix this later
  formData.append("files", {
    uri: params.uri,
    name: params.fileName,
    type: params.mimeType,
  });
  const rawResult = await apiClient
    .post("api/upload", { body: formData })
    .json();
  return UploadFileResultSchema.parse(rawResult);
};
