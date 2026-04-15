import { type ImageSource } from "@vagabond/shared-utils";
import { atom } from "jotai";

interface CurrentPhotoType {
  imageUri: string;
  imageSource: ImageSource;
  localPath: string;
}

export const currentPhotoAtom = atom<CurrentPhotoType | null>(null);
