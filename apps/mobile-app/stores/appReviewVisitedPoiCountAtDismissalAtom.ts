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

const AppReviewVisitedPoiCountAtDismissalSchema = Type.Number();

const validateAppReviewVisitedPoiCountAtDismissal = generateValidator(
  AppReviewVisitedPoiCountAtDismissalSchema,
);

type AppReviewVisitedPoiCountAtDismissal = number | undefined;

const storage = withStorageValidator<AppReviewVisitedPoiCountAtDismissal>(
  (value: unknown): value is AppReviewVisitedPoiCountAtDismissal => {
    if (value === undefined) return true;
    if (!validateAppReviewVisitedPoiCountAtDismissal(value)) {
      logger(
        "Invalid app review visited-poi-count-at-dismissal value, atom should be cleared",
        value,
      );
      return false;
    }
    return true;
  },
)(createJSONStorage(() => AsyncStorage));

const appReviewVisitedPoiCountAtDismissalAtom =
  atomWithStorage<AppReviewVisitedPoiCountAtDismissal>(
    "app-review-visited-poi-count-at-dismissal",
    undefined,
    storage,
    {
      getOnInit: true,
    },
  );

export function useAppReviewVisitedPoiCountAtDismissal(): {
  visitedPoiCountAtDismissal: AppReviewVisitedPoiCountAtDismissal;
  isHydrated: boolean;
  setVisitedPoiCountAtDismissal: (value: number) => Promise<void>;
} {
  const [raw, setValue] = useAtom(appReviewVisitedPoiCountAtDismissalAtom);
  // Storage may return a Promise during async hydration despite getOnInit;
  // bypass TS narrowing to detect that case at runtime.
  const isHydrated = !((raw as unknown) instanceof Promise);
  return {
    visitedPoiCountAtDismissal: isHydrated ? raw : undefined,
    isHydrated,
    setVisitedPoiCountAtDismissal: async (value: number): Promise<void> => {
      await setValue(() => value);
    },
  };
}
