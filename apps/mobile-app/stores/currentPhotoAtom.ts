import { atom } from "jotai";

interface CurrentPhotoType {
  imageUri: string;
  fileId: string;
}

export const currentPhotoAtom = atom<CurrentPhotoType | null>(null);
