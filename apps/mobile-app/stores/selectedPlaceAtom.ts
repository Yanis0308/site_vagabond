// stores/selectedPlaceAtom.ts
import { atom } from "jotai";

import { type PoiType } from "@/utils/types";

export const selectedPlaceAtom = atom<PoiType | null>(null);
