import { useAtomValue } from "jotai";
import { useEffect } from "react";

import { useBackgroundPhotoUpload } from "@/hooks/mutations/useBackgroundPhotoUpload";
import { checkVisitedPoiHasImage } from "@/http/visited-pois";
import {
  deletePhoto,
  scanPendingUploadsDirectory,
} from "@/services/photoStorage";
import { authenticatedUserAtom } from "@/stores/authenticatedUserAtom";
import { logger } from "@/utils/logger";

export const useStartupPhotoRecovery = (): void => {
  const { mutateAsync: uploadPhotoInBackground } = useBackgroundPhotoUpload();
  const authenticatedUser = useAtomValue(authenticatedUserAtom);

  useEffect(() => {
    // Wait until Firebase Auth has hydrated a session; otherwise API calls
    // run without a Bearer header, every status check returns "unknown",
    // and pending uploads stay stuck until the next full app restart.
    if (authenticatedUser === null) {
      return;
    }
    void (async (): Promise<void> => {
      try {
        const { pending, orphans } = scanPendingUploadsDirectory();

        // Clean up orphan files (photos taken but place never validated)
        for (const uri of orphans) {
          logger(`[crashRecovery] Deleting orphan photo: ${uri}`);
          deletePhoto(uri);
        }

        if (pending.length === 0) {
          return;
        }

        logger(`[crashRecovery] Found ${pending.length} pending upload(s)`);

        for (const { uri, visitedPoiId } of pending) {
          try {
            const status = await checkVisitedPoiHasImage(visitedPoiId);

            if (status === "unknown") {
              logger(
                `[crashRecovery] visitedPoi #${visitedPoiId} status unknown, keeping local file for next retry`,
              );
              continue;
            }

            if (status === "has-image") {
              logger(
                `[crashRecovery] visitedPoi #${visitedPoiId} already has image (or deleted), removing local file`,
              );
              deletePhoto(uri);
              continue;
            }

            await uploadPhotoInBackground({ localUri: uri, visitedPoiId });
          } catch (error) {
            logger(
              `[crashRecovery] Failed to process visitedPoi #${visitedPoiId}:`,
              error,
            );
          }
        }
      } catch (error) {
        logger("[crashRecovery] Unexpected error during recovery:", error);
      }
    })();
  }, [authenticatedUser, uploadPhotoInBackground]);
};
