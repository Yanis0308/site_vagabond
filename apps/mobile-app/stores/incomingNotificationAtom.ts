import { atom } from "jotai";

export interface IncomingNotification {
  notificationId: string;
  title: string | undefined;
  body: string | undefined;
  deepLink: string;
}

// Holds the latest foreground notification awaiting toast display. The
// NotificationToast component reads this atom and clears it once the toast
// has been surfaced (or dismissed). Background and cold-start opens do NOT
// flow through this atom — they navigate directly.
export const incomingNotificationAtom = atom<IncomingNotification | null>(null);
