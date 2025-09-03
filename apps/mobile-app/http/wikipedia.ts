import { logger } from "@/utils/logger";

import { hubClient } from "./hub-client";

// Types pour la réponse de Hub Toolforge
interface HubDestination {
  url: string;
  site?: string;
  lang?: string;
}

interface HubOrigin {
  wikidata?: string;
  wikipedia?: string;
}

interface HubResponse {
  origin: HubOrigin;
  destination: HubDestination;
}

/**
 * Récupère le lien Wikipedia pour un lieu en utilisant les données Wikidata
 * @param wikidataId - ID Wikidata (ex: "Q1234")
 * @param lang - Langue souhaitée (par défaut "fr")
 * @returns URL Wikipedia ou null si non trouvé
 */
export const getWikipediaLink = async (
  wikidataId: string,
  lang = "fr",
): Promise<string | null> => {
  try {
    // Construction de l'URL Hub: /{wikidata-id}?lang={lang}&format=json
    const response = await hubClient.get(`${wikidataId}`, {
      searchParams: {
        lang,
        format: "json",
      },
      throwHttpErrors: false,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      } else {
        throw new Error("Erreur lors de la récupération du lien Wikipedia");
      }
    }

    const responseData = await response.json<HubResponse>();

    // Vérifier si on a une URL valide
    if (responseData.destination.url !== "") {
      return responseData.destination.url;
    }

    return null;
  } catch (error) {
    logger("Erreur lors de la récupération du lien Wikipedia:", error);
    throw error;
  }
};
