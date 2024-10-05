import { useSession } from "@/contexts/AuthContext";
import { uploadFile } from "@/http/upload-file";
import { useMutation } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";

export type UploadFileParams = Pick<
  ImagePickerAsset,
  "uri" | "fileName" | "mimeType"
>;

export const useUploadFileMutation = () => {
  const { session } = useSession();

  return useMutation({
    mutationFn: async (params: UploadFileParams) => {
      return await uploadFile(session, params);
    },
  });
};
