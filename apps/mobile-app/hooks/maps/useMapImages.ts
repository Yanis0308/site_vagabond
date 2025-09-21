import { type ImageEntry } from "@rnmapbox/maps";
import { useMemo } from "react";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- will fix later
const bearingImage = require("@/assets/images/bearing-icon.png");
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- will fix later
const checkIcon = require("@/assets/images/icons/check.png");
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- will fix later
const questionMarkIcon = require("@/assets/images/icons/question-mark.png");

export const useMapImages = (): Record<string, ImageEntry> => {
  return useMemo<Record<string, ImageEntry>>(
    () => ({
      //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- will fix later
      bearingImage: bearingImage,
      //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- will fix later
      checkmark: checkIcon,
      //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- will fix later
      questionMark: questionMarkIcon,
    }),
    [],
  );
};
