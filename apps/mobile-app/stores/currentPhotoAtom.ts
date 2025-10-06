import { atom } from "jotai";

interface CurrentPhotoType {
  imageUri: string;
  fileId: string | null;
}

export const currentPhotoAtom = atom<CurrentPhotoType | null>(null);
