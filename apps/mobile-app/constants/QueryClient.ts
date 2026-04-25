import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { type OmitKeyof, QueryClient } from "@tanstack/react-query";
import { type PersistQueryClientOptions } from "@tanstack/react-query-persist-client";

import {
  analyticsOnMutationError,
  analyticsOnQueryError,
} from "@/lib/analytics/react-query";
import { logger } from "@/utils/logger";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      //staleTime: Infinity, // Let default stale time of 0 seconds, it's background fetching
      gcTime: 1000 * 60 * 60 * 24 * 30, // 30 jours avant la suppression du cache inutilisé

      throwOnError: (error: Error, { queryKey }): boolean => {
        analyticsOnQueryError(error, queryKey);
        logger("query error", error);
        //alert(error.message);
        return false;
      },
    },
    mutations: {
      throwOnError: false,
      onError: (error, _, __, { mutationKey }): void => {
        analyticsOnMutationError(error, mutationKey);
        logger("mutation error", error);

        if (error.name === "UserFeedbackSubmissionError") {
          return;
        }

        alert(error.message);
      },
    },
  },
});

export const PERSIST_OPTIONS: OmitKeyof<
  PersistQueryClientOptions,
  "queryClient"
> = {
  persister: createAsyncStoragePersister({
    storage: AsyncStorage,
  }),
  maxAge: 1000 * 60 * 60 * 24 * 30, //  30 jours
};
