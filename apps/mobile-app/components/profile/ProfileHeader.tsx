import type { UserMe } from "@vagabond/shared-utils";
import { memo, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { Optional } from "utility-types";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { getPlainTextDate } from "@/utils/date";
import { localImages } from "@/utils/localImages";

interface ProfileHeaderProps {
  userData?: Optional<
    Pick<UserMe, "fullName" | "email" | "createdAt">,
    "email"
  > | null;
}

export const ProfileHeader = memo(
  ({ userData }: ProfileHeaderProps): ReactElement => {
    const { i18n } = useTranslation();

    const registrationDate =
      userData?.createdAt !== undefined && userData.createdAt.length > 0
        ? getPlainTextDate({
            locale: i18n.language,
            date: new Date(userData.createdAt),
          })
        : undefined;

    return (
      <VStack className="items-center gap-4 py-4">
        <Box className="rounded-full bg-white p-2 shadow-sm">
          <CustomImage
            sources={localImages.appLogo}
            height={100}
            width={100}
            className="rounded-full"
            contentFit="cover"
            showLoader={false}
          />
        </Box>
        <VStack className="items-center gap-1">
          <CustomText className="text-xl font-bold text-gray-900">
            {userData?.fullName}
          </CustomText>
          {registrationDate !== undefined && (
            <CustomText className="text-sm text-gray-600">
              {`Vagabond depuis le ${registrationDate}`}
            </CustomText>
          )}
        </VStack>
      </VStack>
    );
  },
);

ProfileHeader.displayName = "ProfileHeader";
