import { ChevronRight } from "lucide-react-native";
import { memo, type ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Pressable } from "react-native";
import {
  checkNotifications,
  type PermissionStatus,
  RESULTS,
} from "react-native-permissions";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { logger } from "@/utils/logger";
import { openNotificationSettings } from "@/utils/notification-settings";

type DisplayState = "granted" | "denied";

const toDisplayState = (status: PermissionStatus): DisplayState =>
  status === RESULTS.GRANTED || status === RESULTS.LIMITED
    ? "granted"
    : "denied";

export const ProfileManageNotificationsRow = memo((): ReactElement => {
  const { t } = useTranslation("common");
  const [displayState, setDisplayState] = useState<DisplayState | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async (): Promise<void> => {
      try {
        const { status } = await checkNotifications();
        if (!cancelled) {
          setDisplayState(toDisplayState(status));
        }
      } catch (error) {
        logger(
          "[ProfileManageNotificationsRow] checkNotifications failed",
          error,
        );
      }
    };

    void refresh();

    // Re-read on app foreground (user may have changed settings in OS)
    const sub = AppState.addEventListener("change", (status): void => {
      if (status === "active") {
        void refresh();
      }
    });

    return (): void => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const handlePress = async (): Promise<void> => {
    await openNotificationSettings();

    // Re-read state after coming back from OS settings.
    try {
      const { status } = await checkNotifications();
      setDisplayState(toDisplayState(status));
    } catch (error) {
      logger(
        "[ProfileManageNotificationsRow] checkNotifications refresh failed",
        error,
      );
    }
  };

  const subtitle =
    displayState === "granted"
      ? t("notifications.manage_row.subtitle_granted")
      : displayState === "denied"
        ? t("notifications.manage_row.subtitle_denied")
        : "";

  return (
    <Pressable
      onPress={(): void => void handlePress()}
      accessibilityRole="button"
      accessibilityLabel={t("notifications.manage_row.title")}
      className="rounded-lg bg-background-100 px-4 py-3 active:opacity-70"
    >
      <HStack className="items-center justify-between">
        <VStack className="flex-1 gap-1">
          <CustomText className="text-base font-medium text-typography-900">
            {t("notifications.manage_row.title")}
          </CustomText>
          {subtitle !== "" ? (
            <CustomText className="text-sm text-typography-500">
              {subtitle}
            </CustomText>
          ) : null}
        </VStack>
        <Box className="ml-3">
          <ChevronRight
            size={20}
            color={themeColors.typography["500"].hex}
            strokeWidth={2}
          />
        </Box>
      </HStack>
    </Pressable>
  );
});

ProfileManageNotificationsRow.displayName = "ProfileManageNotificationsRow";
