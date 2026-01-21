export interface BoundaryInfo {
  cityName?: string | null;
  regionName?: string | null;
  countryName?: string | null;
}

export interface BuildGeminiPromptParams {
  googleMapsData: Record<string, unknown>;
  jinaData: Record<string, unknown>;
  wikidataData: Record<string, unknown>;
  wikipediaData: Record<string, unknown>;
  poiName: string;
  latitude: number;
  longitude: number;
  osmTags: Record<string, unknown> | null;
  boundaries?: BoundaryInfo;
}

/**
 * Helper to build a comma-separated list of available sources
 */
function getSourcesList(hasWikidata: boolean, hasWikipedia: boolean): string {
  const sources = ["Google Maps", "résultats web"];
  if (hasWikidata) sources.push("Wikidata");
  if (hasWikipedia) sources.push("Wikipedia");
  return sources.join(", ");
}

/**
 * Check if data object is non-empty
 */
function hasData(data: Record<string, unknown> | null | undefined): boolean {
  return (
    data !== null &&
    data !== undefined &&
    typeof data === "object" &&
    Object.keys(data).length > 0
  );
}

/**
 * Extract location information from available data sources
 */
function extractLocationInfo(boundaries: BoundaryInfo | undefined): {
  cityName: string | null;
  regionName: string | null;
  countryName: string | null;
} {
  let cityName: string | null = null;
  let regionName: string | null = null;
  let countryName: string | null = null;

  // Priority 1: Use boundaries data if available
  if (boundaries !== undefined) {
    cityName = boundaries.cityName ?? null;
    regionName = boundaries.regionName ?? null;
    countryName = boundaries.countryName ?? null;
  }

  return { cityName, regionName, countryName };
}

/**
 * Build the Gemini prompt for POI enrichment
 */
export function buildGeminiPrompt(params: BuildGeminiPromptParams): string {
  const {
    googleMapsData,
    jinaData,
    wikidataData,
    wikipediaData,
    poiName,
    latitude,
    longitude,
    osmTags,
    boundaries,
  } = params;

  const hasOsmTags = osmTags !== null;
  const hasWikidataData = hasData(wikidataData);
  const hasWikipediaData = hasData(wikipediaData);
  const hasGoogleMapsData = hasData(googleMapsData);
  const hasJinaData = hasData(jinaData);
  const sourcesList = getSourcesList(hasWikidataData, hasWikipediaData);

  // Extract location info from data sources (priority: boundaries > OSM > Google Maps)
  const extractedLocation = extractLocationInfo(boundaries);
  const cityName = extractedLocation.cityName ?? "Non spécifiée";
  const regionName = extractedLocation.regionName ?? "Non spécifiée";
  const countryName = extractedLocation.countryName ?? "Non spécifiée";

  // Build hierarchy of sources with priorities
  const hierarchyItems: string[] = [];
  let currentPriority = 1;

  if (hasOsmTags) {
    hierarchyItems.push(
      `${currentPriority}. **Tags OSM** - Source de vérité absolue. Valide toutes les autres sources contre ces données.`,
    );
    currentPriority++;
  }

  if (hasWikidataData || hasWikipediaData) {
    hierarchyItems.push(
      `${currentPriority}. **Wikidata/Wikipedia** - Sources structurées fiables.`,
    );
    currentPriority++;
  }

  if (hasGoogleMapsData) {
    hierarchyItems.push(
      `${currentPriority}. **Google Maps** - À valider contre les sources prioritaires.`,
    );
    currentPriority++;
  }

  if (hasJinaData) {
    hierarchyItems.push(
      `${currentPriority}. **Résultats web** - À valider contre les sources prioritaires.`,
    );
  }

  // Build data sections
  const dataSections: string[] = [];

  if (hasOsmTags) {
    dataSections.push(`### Tags OSM (SOURCE DE VÉRITÉ)
${JSON.stringify(osmTags, null, 2)}`);
  }

  if (hasWikidataData) {
    dataSections.push(`### Wikidata
${JSON.stringify(wikidataData, null, 2)}`);
  }

  if (hasWikipediaData) {
    dataSections.push(`### Wikipedia
${JSON.stringify(wikipediaData, null, 2)}`);
  }

  if (hasGoogleMapsData) {
    dataSections.push(`### Google Maps
${JSON.stringify(googleMapsData, null, 2)}`);
  }

  if (hasJinaData) {
    dataSections.push(`### Résultats web
${JSON.stringify(jinaData, null, 2)}`);
  }

  const prompt = `## RÔLE
Expert en données touristiques chargé d'enrichir les informations d'un point d'intérêt.

## CONTEXTE POI
- Nom: ${poiName}
- Ville: ${cityName}
- Région: ${regionName}
- Pays: ${countryName}
- Coordonnées: ${latitude}, ${longitude}

## HIÉRARCHIE DES SOURCES (par ordre de priorité)
${hierarchyItems.join("\n")}

Ignore toute donnée qui ne correspond pas au POI cible (nom différent, lieu différent, caractéristiques incompatibles).

## DONNÉES DISPONIBLES

${dataSections.join("\n\n")}

## RÈGLES DE QUALITÉ

1. **Fidélité aux sources**: Utilise uniquement les informations documentées dans ${sourcesList}.
2. **Gestion des absences**: 
   - Pour les champs optionnels (objets complexes), omets complètement le champ si l'information n'est pas disponible (ne génère pas d'objet avec des valeurs null).
   - Pour les champs simples optionnels, tu peux utiliser null si l'information n'est pas disponible.
   - Ne génère jamais null pour des propriétés requises à l'intérieur d'un objet (comme durationInMinutes dans averageVisitDuration).
3. **Exactitude des données factuelles**: Reproduis exactement les dates, heures et prix sans modification.
4. **Fun facts**: Propose des anecdotes surprenantes, historiques ou insolites, distinctes de la description principale. Base-toi uniquement sur des faits documentés.

## TÂCHE
Génère une réponse JSON complète en français pour le POI "${poiName}" en utilisant uniquement les données validées.`;

  return prompt;
}
