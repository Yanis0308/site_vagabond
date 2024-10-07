import { UploadFileParams } from "@/hooks/mutations/useUploadFileMutation";
import { apiClient } from "@/http/api-client";
import { z } from "zod";

const UploadFileResultSchema = z
  .array(
    z.object({
      id: z.number(),
    }),
  )
  .nonempty();

type UploadFileResult = z.infer<typeof UploadFileResultSchema>;

export const uploadFile = async (
  accessToken: string | null,
  params: UploadFileParams,
): Promise<UploadFileResult> => {
  const formData = new FormData();
  formData.append("files", {
    uri: params.uri,
    name: params.fileName,
    type: params.mimeType,
  } as any);
  const rawResult = await apiClient(accessToken)
    .post("api/upload", { body: formData })
    .json();
  return UploadFileResultSchema.parse(rawResult);
};
