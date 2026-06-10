import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  // eslint-disable-next-line no-restricted-imports -- we need to use the expo image component
  Image,
  type ImageRef,
} from "expo-image";

import { USER_AGENT } from "@/constants/Http";
import { logger } from "@/utils/logger";

export type ImageLoadAsyncSource = Parameters<typeof Image.loadAsync>[0];

interface UseImageFromMultipleSourcesOptions {
  maxImageSize: number;
}

export const useImageFromMultipleSources = (
  sources: ImageLoadAsyncSource[],
  options: UseImageFromMultipleSourcesOptions,
): UseQueryResult<ImageRef | number | null> => {
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- only maxImageSize affects the loaded image; using the full `options` object would re-key on every render when callers pass an inline object (risk of cache misses / refetch loops)
  return useQuery<ImageRef | number | null>({
    queryKey: ["imageSources", sources, options.maxImageSize],
    queryFn: async () => {
      for (const source of sources) {
        try {
          if (typeof source === "number") {
            return source;
          }
          return await Image.loadAsync({
            ...(typeof source === "string" ? { uri: source } : source),
            headers: {
              "User-Agent": USER_AGENT,
            },
            ...options,
          });
        } catch (error) {
          logger("Erreur lors du chargement de l'image:", error);
        }
      }
      return null;
    },
  });
};
