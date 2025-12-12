import { atom, useAtom } from "jotai";
import { useEffect } from "react";

import { type PoiType } from "@/utils/types";

// Type union : null | string (ID pending) | PoiType (sélectionné)
type PlaceSelectionValue = PoiType | string | null;

// Atom unifié pour la gestion de l'état de sélection
// - null : rien de sélectionné
// - string : ID en attente (pending)
// - PoiType : lieu sélectionné
const placeSelectionAtom = atom<PlaceSelectionValue>(null);

// Atom pour stocker les données des places
export interface PlacesData {
  data: PoiType[] | undefined;
  isFetching: boolean;
}

export const placesAtom = atom<PlacesData>({
  data: undefined,
  isFetching: false,
});

interface UsePlaceSelectionReturn {
  selectedPlace: PoiType | null;
  setSelectedPlace: (place: PoiType | null) => void;
  setPendingPlaceId: (placeId: string | null) => void;
  pendingPlaceId: string | null;
  placesData: PoiType[] | undefined;
  isFetchingPlaces: boolean;
}

// Helpers pour déterminer le type de la valeur
const isPendingId = (value: PlaceSelectionValue): value is string => {
  return typeof value === "string";
};

const isSelectedPlace = (value: PlaceSelectionValue): value is PoiType => {
  return value !== null && typeof value === "object";
};

/**
 * Hook unifié pour gérer la sélection de lieu.
 *
 * Centralise toute la logique de sélection incluant :
 * - La gestion de selectedPlace et pendingPlaceId via des atoms Jotai
 * - La sélection automatique quand pendingPlaceId est défini
 * - La mise à jour automatique de selectedPlace quand placesData change
 */
export const usePlaceSelection = (): UsePlaceSelectionReturn => {
  // Gestion de l'état unifié via atom Jotai
  const [placeSelection, setPlaceSelection] = useAtom(placeSelectionAtom);
  const [places] = useAtom(placesAtom);

  const { data: placesData, isFetching: isFetchingPlaces } = places;

  // Extraire selectedPlace et pendingPlaceId depuis la valeur unifiée
  const selectedPlace: PoiType | null = isSelectedPlace(placeSelection)
    ? placeSelection
    : null;

  const pendingPlaceId: string | null = isPendingId(placeSelection)
    ? placeSelection
    : null;

  // Setters avec conversion automatique
  const setSelectedPlace = (place: PoiType | null): void => {
    setPlaceSelection(place);
  };

  const setPendingPlaceId = (placeId: string | null): void => {
    setPlaceSelection(placeId);
  };

  // Sélectionner automatiquement le lieu une fois que les places sont chargées
  useEffect(() => {
    if (
      isPendingId(placeSelection) &&
      placesData !== undefined &&
      !isFetchingPlaces &&
      placesData.length > 0
    ) {
      const place = placesData.find((p) => p.id === placeSelection);
      if (place !== undefined) {
        // Use setTimeout to avoid cascading renders
        setTimeout(() => {
          setPlaceSelection(place);
        }, 0);
      }
    }
  }, [placeSelection, placesData, isFetchingPlaces, setPlaceSelection]);

  // Mettre à jour le lieu sélectionné quand les données changent pour que le composant PlaceDetailsSheet se mette à jour avec les nouveaux avis etc
  useEffect(() => {
    if (isSelectedPlace(placeSelection) && placesData !== undefined) {
      const updatedPlace = placesData.find(
        (place) => place.id === placeSelection.id,
      );
      if (updatedPlace !== undefined) {
        setPlaceSelection(updatedPlace);
      }
    }
  }, [placeSelection, placesData, setPlaceSelection]);

  return {
    selectedPlace,
    setSelectedPlace,
    setPendingPlaceId,
    pendingPlaceId,
    placesData,
    isFetchingPlaces,
  };
};
