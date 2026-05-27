import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateValidator } from "@vagabond/shared-utils";
import { getDefaultStore } from "jotai";
import {
  atomWithStorage,
  createJSONStorage,
  unstable_withStorageValidator as withStorageValidator,
} from "jotai/utils";
import { type Static, Type } from "typebox";

import { logger } from "@/utils/logger";

// After this delay we force a re-upsert even if the cached entry still
// matches, so the backend refreshes `lastSeenAt` and clears any stale
// `disabledAt` set server-side (e.g. token-not-registered → re-enabled).
export const PUSH_DEVICE_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

const PushDeviceCacheEntrySchema = Type.Object({
  userId: Type.String(),
  token: Type.String(),
  appVersion: Type.String(),
  osVersion: Type.String(),
  lastSyncedAt: Type.String(),
});

export type PushDeviceCacheEntry = Static<typeof PushDeviceCacheEntrySchema>;

type PushDeviceCacheValue = PushDeviceCacheEntry | null;

const validatePushDeviceCacheEntry = generateValidator(
  PushDeviceCacheEntrySchema,
);

const storage = withStorageValidator<PushDeviceCacheValue>(
  (value: unknown): value is PushDeviceCacheValue => {
    if (value === null) return true;
    if (!validatePushDeviceCacheEntry(value)) {
      logger("Invalid push device cache value, atom should be cleared", value);
      return false;
    }
    return true;
  },
)(createJSONStorage(() => AsyncStorage));

const pushDeviceCacheAtom = atomWithStorage<PushDeviceCacheValue>(
  "push_device_last_registration",
  null,
  storage,
  {
    getOnInit: true,
  },
);

const resolve = async (
  value: PushDeviceCacheValue | Promise<PushDeviceCacheValue>,
): Promise<PushDeviceCacheValue> =>
  value instanceof Promise ? await value : value;

export const readPushDeviceCache =
  async (): Promise<PushDeviceCacheEntry | null> => {
    return await resolve(getDefaultStore().get(pushDeviceCacheAtom));
  };

export const writePushDeviceCache = async (
  entry: Omit<PushDeviceCacheEntry, "lastSyncedAt">,
): Promise<void> => {
  await getDefaultStore().set(pushDeviceCacheAtom, {
    ...entry,
    lastSyncedAt: new Date().toISOString(),
  });
};

export const clearPushDeviceCache = async (): Promise<void> => {
  await getDefaultStore().set(pushDeviceCacheAtom, null);
};

export const isPushDeviceCacheStale = (
  entry: PushDeviceCacheEntry,
  now: Date = new Date(),
): boolean => {
  const lastSyncedTime = new Date(entry.lastSyncedAt).getTime();
  if (Number.isNaN(lastSyncedTime)) {
    return true;
  }
  return now.getTime() - lastSyncedTime > PUSH_DEVICE_CACHE_TTL_MS;
};
