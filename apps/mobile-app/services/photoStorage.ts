import { Directory, File, Paths } from "expo-file-system";

import { config } from "@/constants/Config";
import { logger } from "@/utils/logger";

const PHOTO_UPLOADS_DIR_NAME = "photo-uploads";
const DRAFTS_DIR_NAME = "drafts";
const QUEUE_DIR_NAME = "queue";

// Defence-in-depth: a file inside queue/ is only considered a pending upload
// if its name matches `{visitedPoiId}.jpg`. Anything else is treated as a
// malformed leftover and cleaned up at the next scan.
const QUEUED_PHOTO_FILENAME_REGEX = /^(\d+)\.jpg$/i;

function ensureDraftsDirectory(): Directory {
  const dir = new Directory(
    Paths.document,
    PHOTO_UPLOADS_DIR_NAME,
    DRAFTS_DIR_NAME,
  );
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

function ensureQueueDirectory(): Directory {
  const dir = new Directory(
    Paths.document,
    PHOTO_UPLOADS_DIR_NAME,
    QUEUE_DIR_NAME,
  );
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

/**
 * Copies a photo from an external source (expo cache, image-picker result)
 * into the drafts directory under a temporary name. The source file is left
 * untouched so the caller can keep referencing it for previews.
 */
export function saveDraftPhoto(sourceUri: string): string {
  const dir = ensureDraftsDirectory();
  const sourceFile = new File(sourceUri);

  if (!sourceFile.exists) {
    throw new Error(`Photo not found at: ${sourceUri}`);
  }

  const destFile = new File(dir, `draft-${Date.now()}.jpg`);
  sourceFile.copy(destFile);

  logger(`[photoStorage] Saved draft photo: ${destFile.uri}`);
  return destFile.uri;
}

/**
 * Moves a draft photo to the upload queue under the deterministic name
 * `{visitedPoiId}.jpg`. Called once the API has confirmed the creation of
 * the visitedPoi and returned its id.
 */
export function queuePhotoForUpload(
  draftUri: string,
  visitedPoiId: number,
): string {
  const draftFile = new File(draftUri);
  if (!draftFile.exists) {
    throw new Error(`Draft photo not found at: ${draftUri}`);
  }

  const queueDir = ensureQueueDirectory();
  const destFile = new File(queueDir, `${visitedPoiId}.jpg`);

  draftFile.move(destFile);

  logger(
    `[photoStorage] Queued photo for upload: ${destFile.uri} (visitedPoiId: ${visitedPoiId})`,
  );
  return destFile.uri;
}

export interface PendingPhoto {
  uri: string;
  visitedPoiId: number;
}

export interface PendingUploadsScan {
  pending: PendingPhoto[];
  orphans: string[];
}

/**
 * Scans both sub-directories:
 * - everything in drafts/ is an orphan (the user never validated the place
 *   or the app crashed mid-capture)
 * - files in queue/ matching `{visitedPoiId}.jpg` are pending uploads
 * - anything else in queue/ (wrong extension, malformed name) is treated as
 *   an orphan — defence-in-depth in case our own writers ever misbehave
 */
export function scanPendingUploadsDirectory(): PendingUploadsScan {
  const pending: PendingPhoto[] = [];
  const orphans: string[] = [];

  const draftsDir = new Directory(
    Paths.document,
    PHOTO_UPLOADS_DIR_NAME,
    DRAFTS_DIR_NAME,
  );
  if (draftsDir.exists) {
    for (const item of draftsDir.list()) {
      if (item instanceof File) {
        orphans.push(item.uri);
      }
    }
  }

  const queueDir = new Directory(
    Paths.document,
    PHOTO_UPLOADS_DIR_NAME,
    QUEUE_DIR_NAME,
  );
  if (queueDir.exists) {
    for (const item of queueDir.list()) {
      if (!(item instanceof File)) {
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec -- String#match plays nicer with optional chaining for the capture group
      const idGroup = item.name.match(QUEUED_PHOTO_FILENAME_REGEX)?.[1];
      const visitedPoiId = idGroup !== undefined ? parseInt(idGroup, 10) : NaN;

      if (!isNaN(visitedPoiId) && visitedPoiId > 0) {
        pending.push({ uri: item.uri, visitedPoiId });
      } else {
        orphans.push(item.uri);
      }
    }
  }

  logger(
    `[photoStorage] Scan: ${pending.length} pending, ${orphans.length} orphan(s)`,
  );
  return { pending, orphans };
}

export function getLocalPhotoUri(visitedPoiId: number): string | null {
  const queueDir = new Directory(
    Paths.document,
    PHOTO_UPLOADS_DIR_NAME,
    QUEUE_DIR_NAME,
  );
  const file = new File(queueDir, `${visitedPoiId}.jpg`);
  return file.exists ? file.uri : null;
}

export function deletePhoto(localUri: string): void {
  try {
    const file = new File(localUri);
    if (file.exists) {
      file.delete();
      logger(`[photoStorage] Deleted photo: ${localUri}`);
    }
  } catch (error) {
    logger(`[photoStorage] Failed to delete photo ${localUri}:`, error);
  }
}

export function resolveVisitedPoiImageUrl(
  visitedPoi: { id: number; imageKey: string | null },
  ownedByCurrentUser: boolean,
): string | null {
  if (visitedPoi.imageKey !== null) {
    return `${config.cdnUrl}/${visitedPoi.imageKey}`;
  }
  if (ownedByCurrentUser) {
    return getLocalPhotoUri(visitedPoi.id);
  }
  return null;
}
