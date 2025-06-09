import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { defaultConfig } from "tailwind-variants";

const customTwMergeConfig = {
  extend: {
    classGroups: {
      shadow: ["button-submit"],
    },
  },
};
// For Tailwind Variants, embedded in Gluestack UI tva() function that use twMerge internally
defaultConfig.twMergeConfig = customTwMergeConfig.extend;

const extendedTwMerge = extendTailwindMerge(customTwMergeConfig);

// For our own usage
export function cn(...inputs: ClassValue[]): string {
  return extendedTwMerge(clsx(inputs));
}
