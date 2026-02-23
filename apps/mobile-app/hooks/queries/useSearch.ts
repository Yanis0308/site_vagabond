import { useDebouncer } from "@tanstack/react-pacer";
import { useQuery } from "@tanstack/react-query";
import type { SearchResult } from "@vagabond/shared-utils";
import { useEffect, useState } from "react";

import { searchPlaces } from "@/http/search";
import { useSearchTerm } from "@/stores/searchTermAtom";

const DEBOUNCE_DELAY = 250;
const MIN_QUERY_LENGTH = 2;

export const useSearch = (): {
  data: SearchResult[] | undefined;
  isLoading: boolean;
  error: unknown;
} => {
  const { searchTerm } = useSearchTerm();
  const [searchTermDebounced, setSearchTermDebounced] = useState(searchTerm);

  // Créer le debouncer qui met à jour l'état debounced
  const searchDebouncer = useDebouncer(
    (query: string) => {
      setSearchTermDebounced(query);
    },
    { wait: DEBOUNCE_DELAY },
  );

  // Déclencher le debouncer quand searchTerm change
  useEffect(() => {
    searchDebouncer.maybeExecute(searchTerm);
  }, [searchTerm, searchDebouncer]);

  const queryResult = useQuery({
    queryKey: ["search", searchTermDebounced],
    enabled: searchTermDebounced.length >= MIN_QUERY_LENGTH,
    queryFn: async () => {
      return await searchPlaces(searchTermDebounced);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
  };
};
