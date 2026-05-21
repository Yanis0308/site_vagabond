import AsyncStorage from "@react-native-async-storage/async-storage";
import { validateWithSchema } from "@vagabond/shared-utils";
import { useAtom } from "jotai";
import {
  atomWithStorage,
  createJSONStorage,
  unstable_withStorageValidator as withStorageValidator,
} from "jotai/utils";
import { Type } from "typebox";

import { logger } from "@/utils/logger";

// Persisted marker: flips to `true` the first time we call
// `messaging().requestPermission()` (from the pre-prompt OR the profile row).
//
// Used on Android to distinguish "first-time never asked" from "user-denied":
// FCM's `hasPermission()` returns DENIED in both cases on Android 13+, so the
// row needs this marker to know whether to fire the native prompt or send the
// user to OS settings.

const PushPermissionEverRequestedSchema = Type.Boolean();

type PushPermissionEverRequested = boolean | undefined;

const storage = withStorageValidator<PushPermissionEverRequested>(
  (value: unknown): value is PushPermissionEverRequested => {
    if (value === undefined) return true;
    if (!validateWithSchema(PushPermissionEverRequestedSchema, value)) {
      logger(
        "Invalid push-permission-ever-requested value, atom should be cleared",
        value,
      );
      return false;
    }
    return true;
  },
)(createJSONStorage(() => AsyncStorage));

const pushPermissionEverRequestedAtom =
  atomWithStorage<PushPermissionEverRequested>(
    "push-permission-ever-requested",
    undefined,
    storage,
    {
      getOnInit: true,
    },
  );

export function usePushPermissionEverRequested(): {
  everRequested: boolean;
  isHydrated: boolean;
  markRequested: () => Promise<void>;
} {
  const [raw, setValue] = useAtom(pushPermissionEverRequestedAtom);
  // Storage may return a Promise during async hydration despite getOnInit;
  // bypass TS narrowing to detect that case at runtime.
  const isHydrated = !((raw as unknown) instanceof Promise);
  return {
    everRequested: isHydrated ? (raw ?? false) : false,
    isHydrated,
    markRequested: async (): Promise<void> => {
      await setValue(() => true);
    },
  };
}
