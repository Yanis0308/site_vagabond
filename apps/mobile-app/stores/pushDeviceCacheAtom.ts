import AsyncStorage from "@react-native-async-storage/async-storage";
import { validateWithSchema } from "@vagabond/shared-utils";
import { getDefaultStore } from "jotai";
import {
  atomWithStorage,
  createJSONStorage,
  unstable_withStorageValidator as withStorageValidator,
} from "jotai/utils";
import { type Static, Type } from "typebox";

import { logger } from "@/utils/logger";

const PushDeviceCacheEntrySchema = Type.Object({
  userId: Type.String(),
  token: Type.String(),
  appVersion: Type.String(),
  osVersion: Type.String(),
});

export type PushDeviceCacheEntry = Static<typeof PushDeviceCacheEntrySchema>;

type PushDeviceCacheValue = PushDeviceCacheEntry | null;

const storage = withStorageValidator<PushDeviceCacheValue>(
  (value: unknown): value is PushDeviceCacheValue => {
    if (value === null) return true;
    if (!validateWithSchema(PushDeviceCacheEntrySchema, value)) {
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
  entry: PushDeviceCacheEntry,
): Promise<void> => {
  await getDefaultStore().set(pushDeviceCacheAtom, entry);
};

export const clearPushDeviceCache = async (): Promise<void> => {
  await getDefaultStore().set(pushDeviceCacheAtom, null);
};
