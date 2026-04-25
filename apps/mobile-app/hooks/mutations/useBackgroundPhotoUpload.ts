import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { queryClient } from "@/constants/QueryClient";
import { uploadVisitedPoiPhoto } from "@/http/upload-file";
import { trackEvent } from "@/lib/analytics/analytics";
import { deletePhoto } from "@/services/photoStorage";
import { uploadingFilesAtom } from "@/stores/uploadStateAtom";
import { logger } from "@/utils/logger";

interface BackgroundPhotoUploadVariables {
  localUri: string;
  visitedPoiId: number;
}

export const BACKGROUND_PHOTO_UPLOAD_MUTATION_KEY = [
  "background-photo-upload",
] as const;

export const useBackgroundPhotoUpload = (): UseMutationResult<
  void,
  Error,
  BackgroundPhotoUploadVariables
> => {
  const setUploadingFiles = useSetAtom(uploadingFilesAtom);

  return useMutation({
    mutationKey: BACKGROUND_PHOTO_UPLOAD_MUTATION_KEY,
    retry: 10,
    mutationFn: async ({
      localUri,
      visitedPoiId,
    }: BackgroundPhotoUploadVariables): Promise<void> => {
      logger(
        `[backgroundUpload] Starting upload for visitedPoi #${visitedPoiId}`,
      );
      try {
        await uploadVisitedPoiPhoto(localUri, visitedPoiId);
      } catch (error) {
        logger(
          `[backgroundUpload] Upload failed for visitedPoi #${visitedPoiId}, will retry on next startup:`,
          error,
        );
        throw error;
      }
      logger(
        `[backgroundUpload] Upload complete for visitedPoi #${visitedPoiId}`,
      );
    },
    onMutate: ({ visitedPoiId }) => {
      setUploadingFiles((prev: Set<number>) => new Set(prev).add(visitedPoiId));
    },
    onSuccess: async (_data, { localUri, visitedPoiId }) => {
      void trackEvent("photo_upload_succeeded", {
        visited_poi_id: visitedPoiId,
      });
      setUploadingFiles((prev: Set<number>) => {
        const next = new Set(prev);
        next.delete(visitedPoiId);
        return next;
      });
      // Refetch visited-poi queries so the cache picks up the new imageKey
      // before we delete the local file the UI is still rendering.
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["user-visited-pois"] }),
        queryClient.refetchQueries({ queryKey: ["visited-pois"] }),
      ]);
      deletePhoto(localUri);
    },
    onError: (error: Error, { visitedPoiId }) => {
      void trackEvent("photo_upload_failed", {
        reason: error.message,
        visited_poi_id: visitedPoiId,
      });
      setUploadingFiles((prev: Set<number>) => {
        const next = new Set(prev);
        next.delete(visitedPoiId);
        return next;
      });
    },
  });
};
