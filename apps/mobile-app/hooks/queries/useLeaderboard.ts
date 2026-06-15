import { useDebouncer } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { LeaderboardUser } from "@vagabond/shared-utils";
import { useEffect, useState } from "react";

import { getLeaderboardV2 } from "@/http/leaderboard";

const SEARCH_DEBOUNCE_DELAY = 200;
// En-dessous de ce seuil, on ne filtre pas : on affiche le classement complet
// plutôt que de déclencher une requête ILIKE peu utile (cf. recherche de lieux).
const MIN_SEARCH_LENGTH = 2;

interface Page {
  items: LeaderboardUser[];
  nextCursor: string | null;
  period: "all-time" | "monthly";
}

// v2 : infinite scroll du top.
// La position personnelle est servie séparément par useLeaderboardMe (section sticky).
export const useLeaderboard = ({
  period,
  searchTerm,
}: {
  period: "all-time" | "monthly";
  searchTerm: string;
}): {
  items: LeaderboardUser[];
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  error: unknown;
  appliedSearchTerm: string;
} => {
  // On debounce le terme utilisé pour la requête : l'input reste piloté par la
  // valeur immédiate côté parent, seule la query attend la fin de la frappe.
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const searchDebouncer = useDebouncer(
    (term: string): void => {
      setDebouncedSearchTerm(term);
    },
    { wait: SEARCH_DEBOUNCE_DELAY },
  );

  useEffect((): void => {
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-derived-state -- valeur temporisée (debounce) : non calculable au render, l'effet est nécessaire
    searchDebouncer.maybeExecute(searchTerm);
  }, [searchTerm, searchDebouncer]);

  // Terme réellement appliqué : on n'envoie le filtre qu'à partir de
  // MIN_SEARCH_LENGTH, sinon "" (= classement complet, pas de requête filtrée).
  const trimmedSearchTerm = debouncedSearchTerm.trim();
  const appliedSearchTerm =
    trimmedSearchTerm.length >= MIN_SEARCH_LENGTH ? trimmedSearchTerm : "";

  const query = useInfiniteQuery({
    queryKey: ["leaderboard", "v2", period, appliedSearchTerm],
    queryFn: ({
      pageParam,
    }: {
      pageParam: string | undefined;
    }): Promise<Page> =>
      getLeaderboardV2({
        period,
        searchTerm: appliedSearchTerm,
        after: pageParam,
      }),
    initialPageParam: undefined,
    getNextPageParam: (last: Page) => last.nextCursor ?? undefined,
  });

  const items = (query.data?.pages ?? []).flatMap((p: Page) => p.items);

  return {
    items,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isSuccess: query.isSuccess,
    error: query.error,
    appliedSearchTerm,
  };
};
