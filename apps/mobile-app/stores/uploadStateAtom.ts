import { atom } from "jotai";

/** Set of visitedPoiIds currently being uploaded. */
export const uploadingFilesAtom = atom(new Set<number>());
