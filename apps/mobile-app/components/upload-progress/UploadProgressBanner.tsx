import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import * as Progress from "react-native-progress";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { cn as cx } from "@/utils/cn";

type BannerStatus = "uploading" | "success";

interface UploadProgressBannerProps {
  status: BannerStatus;
}

export function UploadProgressBanner({
  status,
}: UploadProgressBannerProps): ReactElement {
  const { t } = useTranslation("common");

  return (
    <Box
      className={cx(
        "self-end rounded-md p-2 mr-2",
        status === "success" ? "bg-success-600" : "bg-primary-500",
      )}
    >
      <CustomText className="text-xs font-medium text-white">
        {status === "uploading"
          ? t("upload_progress.uploading")
          : t("upload_progress.success")}
      </CustomText>

      {status === "uploading" && (
        <Box className="mt-1.5">
          <Progress.Bar
            width={null}
            height={2}
            borderWidth={0}
            color="rgba(255, 255, 255, 0.9)"
            unfilledColor="rgba(255, 255, 255, 0.3)"
            animated={true}
            useNativeDriver={true}
            indeterminate={true}
          />
        </Box>
      )}
    </Box>
  );
}
