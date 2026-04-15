import { useAtomValue } from "jotai";
import React, { type ReactElement, useEffect, useRef } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";

import { UploadProgressBanner } from "@/components/upload-progress/UploadProgressBanner";
import { uploadingFilesAtom } from "@/stores/uploadStateAtom";

const UPLOADING_TOAST_ID = "upload-progress";

// Below Search bar
const UPLOAD_TOAST_TOP_OFFSET = 75;

type UploadBannerStatus = "uploading" | "success";

function createUploadToastElement(status: UploadBannerStatus): ReactElement {
  return React.createElement(
    View,
    { style: { marginTop: UPLOAD_TOAST_TOP_OFFSET } },
    React.createElement(UploadProgressBanner, { status }),
  );
}

export function useUploadToast(): void {
  const uploadingFiles = useAtomValue(uploadingFilesAtom);
  const prevSizeRef = useRef(0);

  const currentSize = uploadingFiles.size;

  useEffect(() => {
    const prevSize = prevSizeRef.current;
    prevSizeRef.current = currentSize;

    if (prevSize === 0 && currentSize > 0) {
      toast.custom(createUploadToastElement("uploading"), {
        duration: Infinity,
        id: UPLOADING_TOAST_ID,
      });
      return;
    }

    if (prevSize > 0 && currentSize === 0) {
      toast.dismiss(UPLOADING_TOAST_ID);
      toast.custom(createUploadToastElement("success"), { duration: 2000 });
    }
  }, [currentSize]);
}
