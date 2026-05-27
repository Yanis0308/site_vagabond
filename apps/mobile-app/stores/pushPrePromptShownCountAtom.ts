import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateValidator } from "@vagabond/shared-utils";
import { useAtom } from "jotai";
import {
  atomWithStorage,
  createJSONStorage,
  unstable_withStorageValidator as withStorageValidator,
} from "jotai/utils";
import { Type } from "typebox";

import { logger } from "@/utils/logger";

const PushPrePromptShownCountSchema = Type.Number();

type PushPrePromptShownCount = number | undefined;

const validatePushPrePromptShownCount = generateValidator(
  PushPrePromptShownCountSchema,
);

const storage = withStorageValidator<PushPrePromptShownCount>(
  (value: unknown): value is PushPrePromptShownCount => {
    if (value === undefined) return true;
    if (!validatePushPrePromptShownCount(value)) {
      logger(
        "Invalid push-pre-prompt-shown-count value, atom should be cleared",
        value,
      );
      return false;
    }
    return true;
  },
)(createJSONStorage(() => AsyncStorage));

const pushPrePromptShownCountAtom = atomWithStorage<PushPrePromptShownCount>(
  "push-pre-prompt-shown-count",
  undefined,
  storage,
  {
    getOnInit: true,
  },
);

export function usePushPrePromptShownCount(): {
  count: number;
  isHydrated: boolean;
  incrementCount: () => Promise<void>;
} {
  const [raw, setValue] = useAtom(pushPrePromptShownCountAtom);
  // Storage may return a Promise during async hydration despite getOnInit;
  // bypass TS narrowing to detect that case at runtime.
  const isHydrated = !((raw as unknown) instanceof Promise);
  return {
    count: isHydrated ? (raw ?? 0) : 0,
    isHydrated,
    incrementCount: async (): Promise<void> => {
      await setValue((prev) => (typeof prev === "number" ? prev : 0) + 1);
    },
  };
}
