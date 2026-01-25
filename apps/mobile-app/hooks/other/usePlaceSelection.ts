import { atom, useAtom } from "jotai";

import { type PoiType } from "@/utils/types";

// Atom unifié pour la gestion de l'état de sélection
// - null : rien de sélectionné
// - PoiType : lieu sélectionné
const placeSelectionAtom = atom<PoiType | null>(null);

interface UsePlaceSelectionReturn {
  selectedPlace: PoiType | null;
  setSelectedPlace: (place: PoiType | null) => void;
}

/**
 * Hook unifié pour gérer la sélection de lieu.
 *
 * Centralise toute la logique de sélection via un atom Jotai.
 * La sélection est maintenant directe depuis les événements MapBox.
 */
export const usePlaceSelection = (): UsePlaceSelectionReturn => {
  // Gestion de l'état unifié via atom Jotai
  const [selectedPlace, setSelectedPlace] = useAtom(placeSelectionAtom);

  return {
    selectedPlace,
    setSelectedPlace,
  };
};
