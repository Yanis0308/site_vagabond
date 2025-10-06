import { useMutation } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";

import { uploadFile } from "@/http/upload-file";

export type UploadFileParams = Pick<
  ImagePickerAsset,
  "uri" | "fileName" | "mimeType"
>;

export const UPLOAD_FILE_MUTATION_KEY = ["uploadFile"] as const;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- not important
export const useUploadFileMutation = () => {
  return useMutation({
    mutationKey: UPLOAD_FILE_MUTATION_KEY,
    mutationFn: async (params: UploadFileParams) => {
      return await uploadFile(params);
    },
  });
};
