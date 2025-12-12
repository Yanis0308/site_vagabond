import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { type OmitKeyof, QueryClient } from "@tanstack/react-query";
import { type PersistQueryClientOptions } from "@tanstack/react-query-persist-client";

import { logger } from "@/utils/logger";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      //staleTime: Infinity, // Let default stale time of 0 seconds, it's background fetching
      gcTime: 1000 * 60 * 60 * 24 * 30, // 30 jours avant la suppression du cache inutilisé
      throwOnError: (error: Error): boolean => {
        logger("query error", error);
        //alert(error.message);
        return false;
      },
    },
    mutations: {
      throwOnError: false,
      onError: (error): void => {
        logger("mutation error", error);
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
