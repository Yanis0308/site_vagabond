import { type ImageEntry } from "@rnmapbox/maps";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { logger } from "@/utils/logger";

const MAX_CONCURRENT_REQUESTS = 1;
const MAX_RETRIES = 0;
const RETRY_DELAY = 300; // ms

// https://picsum.photos/seed/${place.id}/20/20

export const useImageLoader = (
  imgUrls: string[],
): {
  imagesLoaded: Record<string, ImageEntry>;
  pendingRequests: number;
  queueLength: number;
} => {
  const pendingRequestsRef = useRef<number>(0);
  const loadingQueue = useRef<{ url: string; retries: number }[]>(
    imgUrls.map((url) => ({ url, retries: 0 })),
  );

  const [allImagesLoaded, setAllImagesLoaded] = useState<string[]>([]);
  const currentImagesLoaded = useMemo<Record<string, ImageEntry>>(() => {
    return allImagesLoaded
      .filter((url) => imgUrls.includes(url))
      .reduce<Record<string, ImageEntry>>((acc, url) => {
        acc[url] = {
          uri: url,
          cache: "force-cache",
        };
        return acc;
      }, {});
  }, [imgUrls, allImagesLoaded]);

  // Fonction pour traiter la file d'attente des images
  const processImageQueue = useCallback(() => {
    if (
      loadingQueue.current.length === 0 ||
      pendingRequestsRef.current >= MAX_CONCURRENT_REQUESTS
    ) {
      return;
    }

    // Prendre la prochaine image dans la file d'attente
    const imageToLoad = loadingQueue.current.shift();
    if (imageToLoad === undefined) return;

    // Incrémenter le compteur de requêtes en cours
    pendingRequestsRef.current += 1;

    // Charger l'image
    Image.prefetch(imageToLoad.url, "memory-disk")
      .then((success) => {
        if (success) {
          // Mettre à jour l'état des images chargées
          setAllImagesLoaded((prev) => [...prev, imageToLoad.url]);
        } else {
          throw new Error("Échec du préchargement de l'image");
        }
      })
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger(
          `Erreur lors du chargement de l'image pour ${imageToLoad.url}:`,
          errorMessage,
        );

        // Réessayer si le nombre de tentatives n'est pas dépassé
        if (imageToLoad.retries < MAX_RETRIES) {
          logger(
            `Réessai ${imageToLoad.retries + 1}/${MAX_RETRIES} pour ${imageToLoad.url}`,
          );
          loadingQueue.current.push({
            url: imageToLoad.url,
            retries: imageToLoad.retries + 1,
          });

          //   Attendre un peu avant de réessayer
          setTimeout(processImageQueue, RETRY_DELAY);
        }
      })
      .finally(() => {
        // Décrémenter le compteur de requêtes en cours
        pendingRequestsRef.current -= 1;

        // Traiter la prochaine image
        setTimeout(processImageQueue, 0);
      });
  }, []);

  useEffect(
    () => {
      const newQueue = imgUrls.filter((url) => !allImagesLoaded.includes(url));
      loadingQueue.current = newQueue.map((url) => ({ url, retries: 0 }));

      processImageQueue();
    },
    //eslint-disable-next-line react-hooks/exhaustive-deps -- only refresh when imgUrls change
    [imgUrls],
  );

  // Traiter la file d'attente des images
  //   useEffect(() => {
  //     const interval = setInterval(() => {
  //       if (
  //         loadingQueue.current.length > 0 &&
  //         pendingRequestsRef.current < MAX_CONCURRENT_REQUESTS
  //       ) {
  //         processImageQueue();
  //       }
  //     }, 100);

  //     return (): void => {
  //       clearInterval(interval);
  //     };
  //   }, [processImageQueue]);

  return useMemo(
    () => ({
      imagesLoaded: currentImagesLoaded,
      pendingRequests: pendingRequestsRef.current,
      queueLength: loadingQueue.current.length,
    }),
    [currentImagesLoaded],
  );
};
