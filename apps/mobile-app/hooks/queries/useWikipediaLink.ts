import { useQuery } from "@tanstack/react-query";

import { getWikipediaLink } from "@/http/wikidata";

interface UseWikipediaLinkProps {
  wikidataId: string | undefined;
  wikipediaId: string | undefined;
}

/**
 * Hook pour récupérer le lien Wikipedia d'un lieu
 */
export const useWikipediaLink = ({
  wikidataId,
  wikipediaId,
  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for query hook
}: UseWikipediaLinkProps) => {
  const queryKey = ["wikipedia", wikipediaId, wikidataId];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<string | null> => {
      if (wikipediaId !== undefined) {
        return await Promise.resolve(
          `https://www.wikipedia.org/wiki/${wikipediaId}`,
        );
      }

      // Priorité à l'ID Wikidata si disponible
      if (wikidataId !== undefined) {
        return await getWikipediaLink(wikidataId, "fr");
      }

      // Si aucun paramètre n'est fourni
      return null;
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 jours en fresh - les liens Wikipedia ne changent pas souvent
  });
};
