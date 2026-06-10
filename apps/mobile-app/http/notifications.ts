import {
  type NotificationOpenSource,
  type TrackNotificationOpenBody,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";

export interface TrackNotificationOpenInput {
  notificationId: string;
  source?: NotificationOpenSource;
}

export const trackNotificationOpen = async (
  input: TrackNotificationOpenInput,
): Promise<void> => {
  const body: TrackNotificationOpenBody =
    input.source !== undefined ? { source: input.source } : {};

  await apiClient.post(
    `api/users/me/notifications/${input.notificationId}/open`,
    { json: body },
  );
};
