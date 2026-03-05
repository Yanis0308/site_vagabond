import { atom } from "jotai";

interface CurrentPhotoType {
  imageUri: string;
}

export const currentPhotoAtom = atom<CurrentPhotoType | null>(null);
