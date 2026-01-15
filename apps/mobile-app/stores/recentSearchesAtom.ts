import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  generateValidator,
  type jsonSchemas,
  SearchResultSchema,
} from "@vagabond/shared-utils";
import { useAtom, useSetAtom } from "jotai";
import {
  atomWithStorage,
  createJSONStorage,
  unstable_withStorageValidator as withStorageValidator,
} from "jotai/utils";
import { type Static, Type } from "typebox";

import { logger } from "@/utils/logger";

// TypeBox schema for RecentSearch
const RecentSearchSchema = Type.Object({
  result: SearchResultSchema,
  timestamp: Type.Number(),
});

// TypeBox schema for validation
const RecentSearchesRecordSchema = Type.Record(
  Type.String(),
  RecentSearchSchema,
);

// SearchResult type inferred from schema
export type SearchResultType = Static<typeof jsonSchemas.SearchResultSchema>;

// RecentSearch type inferred from schema
export type RecentSearch = Static<typeof RecentSearchSchema>;

// Storage type inferred from schema
export type RecentSearchesRecord = Static<typeof RecentSearchesRecordSchema>;

// Validator function
const validateRecentSearchesRecord = generateValidator(
  RecentSearchesRecordSchema,
);

// Helper function to convert Record to sorted array
const recordToSortedArray = (record: RecentSearchesRecord): RecentSearch[] => {
  return Object.values(record)
    .filter(
      (item): item is RecentSearch =>
        item?.result?.id !== null && item?.result?.id !== undefined,
    )
    .sort((a, b) => b.timestamp - a.timestamp);
};

// Storage with validation using withStorageValidator - it's return default value if validation fails
const storage = withStorageValidator<RecentSearchesRecord>(
  (value: unknown): value is RecentSearchesRecord => {
    if (!validateRecentSearchesRecord(value)) {
      logger("Invalid recent searches data, atom should be cleared", value);
      return false;
    }
    return true;
  },
)(createJSONStorage(() => AsyncStorage));

const recentSearchesAtom = atomWithStorage<RecentSearchesRecord>(
  "recent-searches",
  {},
  storage,
  {
    getOnInit: true,
  },
);

export const useRecentSearches = (): {
  recentSearches: RecentSearch[];
  addRecentSearch: (result: SearchResultType) => Promise<void>;
  removeRecentSearch: (id: string) => Promise<void>;
  clearAllRecentSearches: () => void;
} => {
  const [recentSearchesRecord] = useAtom(recentSearchesAtom);
  const setRecentSearchesRecord = useSetAtom(recentSearchesAtom);

  // Resolve promise if needed and convert to sorted array
  const recentSearchesRecordResolved =
    recentSearchesRecord instanceof Promise ? {} : (recentSearchesRecord ?? {});
  const recentSearches = recordToSortedArray(recentSearchesRecordResolved);

  const addRecentSearch = async (result: SearchResultType): Promise<void> => {
    return await setRecentSearchesRecord(async (prev) => {
      const prevRecord = await prev;

      // Update timestamp if exists, otherwise create new entry
      const now = Date.now();
      const updatedRecord: RecentSearchesRecord = {
        ...prevRecord,
        [result.id]: {
          result,
          timestamp: now,
        },
      };

      // Limit to 100 items (remove oldest first)
      const sortedArray = recordToSortedArray(updatedRecord);
      const limitedArray = sortedArray.slice(0, 100);
      const limitedRecord: RecentSearchesRecord = {};
      for (const item of limitedArray) {
        limitedRecord[item.result.id] = item;
      }

      return limitedRecord;
    });
  };

  const removeRecentSearch = async (id: string): Promise<void> => {
    return await setRecentSearchesRecord(async (prev) => {
      const prevRecord = await prev;
      const { [id]: _, ...rest } = prevRecord;
      return rest;
    });
  };

  const clearAllRecentSearches = (): void => {
    void setRecentSearchesRecord({});
  };

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearAllRecentSearches,
  };
};
