import type { UserMe } from "@vagabond/shared-utils";
import { router } from "expo-router";
import { PencilLine } from "lucide-react-native";
import { memo, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import type { Optional } from "utility-types";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { getPlainTextDate } from "@/utils/date";
import { localImages } from "@/utils/localImages";

interface ProfileHeaderProps {
  allowProfileEdit?: boolean;
  userData?: Optional<
    Pick<UserMe, "fullName" | "nickname" | "email" | "createdAt">,
    "email"
  > | null;
}

export const ProfileHeader = memo(
  ({ allowProfileEdit, userData }: ProfileHeaderProps): ReactElement => {
    const { i18n } = useTranslation("common");

    const registrationDate =
      userData?.createdAt !== undefined && userData.createdAt.length > 0
        ? getPlainTextDate({
            locale: i18n.language,
            date: new Date(userData.createdAt),
          })
        : undefined;

    const handleEditNickname = (): void => {
      router.push({
        pathname: "/user/edit-nickname",
      });
    };

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
          <VStack className="flex flex-row items-center gap-3">
            <CustomText className="text-xl font-bold text-gray-900">
              {userData?.nickname ?? userData?.fullName}
            </CustomText>
            {allowProfileEdit === true && (
              <Pressable onPress={handleEditNickname}>
                <PencilLine size={14} />
              </Pressable>
            )}
          </VStack>
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
