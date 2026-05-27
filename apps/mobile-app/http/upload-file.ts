import {
  type FileInfo,
  generateValidator,
  UploadFileResponseSchema,
} from "@vagabond/shared-utils";
import {
  type FileSystemUploadResult,
  FileSystemUploadType,
  uploadAsync,
} from "expo-file-system/legacy";

import { config } from "@/constants/Config";

import { getFirebaseIdToken } from "./firebase-auth";

const validateUploadFileResponse = generateValidator(UploadFileResponseSchema);

async function sendUploadRequest(
  url: string,
  localUri: string,
  idToken: string,
): Promise<FileSystemUploadResult> {
  return await uploadAsync(url, localUri, {
    httpMethod: "POST",
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName: "file",
    mimeType: "image/jpeg",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
}

/**
 * Uploads a visited-POI photo using expo-file-system/legacy `uploadAsync` so
 * the OS can keep the transfer alive when the app is backgrounded. Used by
 * the background upload flow and the startup crash-recovery hook.
 *
 * Mirrors the 401 retry behaviour of `apiClient`: on 401 we re-read the
 * current user, force-refresh the Firebase token once, and retry the upload.
 */
export const uploadVisitedPoiPhoto = async (
  localUri: string,
  visitedPoiId: number,
): Promise<FileInfo> => {
  const url = new URL(`${config.apiBaseUrl}/api/upload`);
  url.searchParams.set("visitedPoiId", String(visitedPoiId));
  const targetUrl = url.toString();

  let result = await sendUploadRequest(
    targetUrl,
    localUri,
    await getFirebaseIdToken(false),
  );

  if (result.status === 401) {
    result = await sendUploadRequest(
      targetUrl,
      localUri,
      await getFirebaseIdToken(true),
    );
  }

  if (result.status < 200 || result.status >= 300) {
    throw new Error(
      `Upload failed with status ${result.status}: ${result.body}`,
    );
  }

  const parsed: unknown = JSON.parse(result.body);
  if (!validateUploadFileResponse(parsed)) {
    throw new Error("Invalid upload response");
  }

  return parsed.data;
};
