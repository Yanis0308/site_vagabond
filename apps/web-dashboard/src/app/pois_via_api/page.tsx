"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import MapLibre, {
  type MapInstance,
  type MapRef,
  NavigationControl,
  Source,
  Layer,
  Popup,
} from "@vis.gl/react-maplibre";
import {
  type ReactElement,
  type RefObject,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

import { PoiPopup } from "@/components/PoiPopup";
import { useQuery } from "@tanstack/react-query";
import { INITIAL_VIEW_STATE } from "../pois/constants";
import { PoiType } from "./types";
import { type jsonSchemas } from "@vagabond/shared-utils";
import { type RawPoi } from "../pois/types";
import type { GeoJSON, Feature, FeatureCollection, Geometry } from "geojson";

// Constantes pour la gestion des images
const MAX_CONCURRENT_REQUESTS = 20;
const MAX_RETRIES = 10;
const RETRY_DELAY = 200; // ms

export default function PoisPage(): ReactElement {
  const [popupInfo, setPopupInfo] = useState<{
    poi: RawPoi;
    longitude: number;
    latitude: number;
  } | null>(null);
  const mapRef = useRef<MapInstance>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(INITIAL_VIEW_STATE.zoom);
  const pendingRequestsRef = useRef<number>(0);
  const imageQueueRef = useRef<
    Array<{ url: string; id: string; retries: number }>
  >([]);
  const [loadingStatus, setLoadingStatus] = useState({
    total: 0,
    loaded: 0,
    failed: 0,
  });
  const [mapInitialized, setMapInitialized] = useState(false);

  const [bounds, setBounds] = useState<{
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  }>({
    minLat: 50.604425,
    minLng: 3.001737,
    maxLat: 50.660336,
    maxLng: 3.11838,
  });

  // Fonction pour mettre à jour les bounds lorsque la carte est déplacée
  const updateBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const mapBounds = map.getBounds();
    setBounds({
      minLat: mapBounds.getSouth(),
      minLng: mapBounds.getWest(),
      maxLat: mapBounds.getNorth(),
      maxLng: mapBounds.getEast(),
    });
  }, []);

  const { data: poisData } = useQuery<{ data: PoiType[] }>({
    queryKey: ["pois", bounds],
    queryFn: () => {
      return fetch(
        `http://localhost:3000/api/pois?minLat=${bounds.minLat}&minLng=${bounds.minLng}&maxLat=${bounds.maxLat}&maxLng=${bounds.maxLng}`,
      ).then((res) => res.json());
    },
    // Ne pas refetch automatiquement lors du montage du composant
    enabled: mapInitialized,
  });

  // État pour suivre les images chargées
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [triggerCustomShape, setTriggerCustomShape] = useState(true);

  // Création du GeoJSON à partir des données POI
  const geoJsonData = useMemo(() => {
    if (!poisData?.data) return null;

    return {
      type: "FeatureCollection" as const,
      features: poisData.data.map((poi) => ({
        type: "Feature" as const,
        properties: {
          id: poi.id,
          name: poi.data[0]?.name ?? "Sans nom",
          poiData: poi,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [poi.coords.longitude, poi.coords.latitude],
        },
      })),
    } as FeatureCollection;
  }, [poisData?.data, triggerCustomShape]);

  // Fonction pour traiter la file d'attente des images
  const processImageQueue = useCallback(() => {
    const map = mapRef.current;
    if (
      !map ||
      imageQueueRef.current.length === 0 ||
      pendingRequestsRef.current >= MAX_CONCURRENT_REQUESTS
    ) {
      return;
    }

    // Prendre la prochaine image dans la file d'attente
    const nextImage = imageQueueRef.current.shift();
    if (!nextImage) return;

    // Vérifier si l'image est déjà chargée
    if (map.hasImage(nextImage.id)) {
      // Traiter la prochaine image
      setTimeout(processImageQueue, 0);
      return;
    }

    // Incrémenter le compteur de requêtes en cours
    pendingRequestsRef.current += 1;

    // Charger l'image
    void fetch(nextImage.url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.blob();
      })
      .then((blob) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        return new Promise<HTMLImageElement>((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
      })
      .then((img) => {
        if (!map.hasImage(nextImage.id)) {
          map.addImage(nextImage.id, img);
          setLoadedImages((prev) => ({
            ...prev,
            [nextImage.id]: true,
          }));
          setLoadingStatus((prev) => ({
            ...prev,
            loaded: prev.loaded + 1,
          }));
        }
      })
      .catch((error) => {
        console.error(
          `Erreur lors du chargement de l'image pour ${nextImage.id}:`,
          error,
        );

        // Réessayer si le nombre de tentatives n'est pas dépassé
        if (nextImage.retries < MAX_RETRIES) {
          console.log(
            `Réessai ${nextImage.retries + 1}/${MAX_RETRIES} pour ${nextImage.id}`,
          );
          imageQueueRef.current.push({
            ...nextImage,
            retries: nextImage.retries + 1,
          });

          // Attendre un peu avant de réessayer
          setTimeout(processImageQueue, RETRY_DELAY);
        } else {
          setLoadingStatus((prev) => ({
            ...prev,
            failed: prev.failed + 1,
          }));
        }
      })
      .finally(() => {
        // Décrémenter le compteur de requêtes en cours
        pendingRequestsRef.current -= 1;

        // Traiter la prochaine image
        setTimeout(processImageQueue, 0);
      });
  }, []);

  // Fonction pour ajouter une image à la file d'attente
  const queueImageForLoading = useCallback(
    (imageUrl: string, imageId: string) => {
      // Ajouter l'image à la file d'attente
      imageQueueRef.current.push({ url: imageUrl, id: imageId, retries: 0 });

      // Mettre à jour le statut de chargement
      setLoadingStatus((prev) => ({
        ...prev,
        total: prev.total + 1,
      }));

      // Démarrer le traitement si nécessaire
      if (pendingRequestsRef.current < MAX_CONCURRENT_REQUESTS) {
        processImageQueue();
      }
    },
    [processImageQueue],
  );

  // Charger l'image par défaut
  const loadDefaultMarker = useCallback(() => {
    const map = mapRef.current;
    if (!map || map.hasImage("default-marker")) return;

    // queueImageForLoading("marker-icon.png", "default-marker");
  }, [queueImageForLoading]);

  // Charger les images pour tous les POIs
  const loadPoiImages = useCallback(() => {
    if (!poisData?.data) return;

    // Réinitialiser l'état des images pour les nouveaux POIs
    setLoadedImages((prev) => {
      const newState: Record<string, boolean> = {};

      // Conserver uniquement les POIs qui existent encore
      poisData.data.forEach((poi) => {
        if (prev[poi.id] !== undefined) {
          newState[poi.id] = prev[poi.id];
        } else {
          newState[poi.id] = false;
        }
      });

      return newState;
    });

    // Réinitialiser le statut de chargement
    setLoadingStatus({
      total: 0,
      loaded: 0,
      failed: 0,
    });

    // Vider la file d'attente existante
    imageQueueRef.current = [];

    // Ajouter les images à la file d'attente
    poisData.data.forEach((poi) => {
      // Utiliser une taille plus petite pour réduire la charge
      const imageUrl = `https://picsum.photos/seed/${poi.id}/50/50`;
      queueImageForLoading(imageUrl, poi.id);
    });
  }, [poisData?.data, queueImageForLoading]);

  // Traiter la file d'attente des images
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        imageQueueRef.current.length > 0 &&
        pendingRequestsRef.current < MAX_CONCURRENT_REQUESTS
      ) {
        processImageQueue();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [processImageQueue]);

  // Charger les images quand les données POI changent
  useEffect(() => {
    if (poisData?.data && mapRef.current) {
      loadDefaultMarker();
      loadPoiImages();
    }
  }, [poisData?.data, loadDefaultMarker, loadPoiImages]);

  // Ajouter les images à la carte quand elle est chargée
  const onMapLoad = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Mettre à jour les bounds initiales
    updateBounds();

    // Marquer la carte comme initialisée pour activer les requêtes
    setMapInitialized(true);

    // Charger l'image par défaut
    loadDefaultMarker();
  }, [updateBounds, loadDefaultMarker]);

  // Gérer le clic sur un point
  const onLayerClick = useCallback(
    (e: { features?: Array<{ properties: any }> }) => {
      console.log("onLayerClick", e);

      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const poiData = feature.properties.poiData;

        if (poiData) {
          setPopupInfo({
            poi: {
              ...poiData,
              osm_type: "node", // Valeur par défaut
              osm_id: parseInt(poiData.id, 10),
              tags: poiData.data[0]?.rawInfo || {},
              latitude: poiData.coords.latitude,
              longitude: poiData.coords.longitude,
            },
            longitude: poiData.coords.longitude,
            latitude: poiData.coords.latitude,
          });
        }
      }
    },
    [],
  );

  return (
    <div className="flex gap-2">
      <div className="relative h-screen w-screen">
        <MapLibre
          ref={mapRef as unknown as RefObject<MapRef>}
          initialViewState={INITIAL_VIEW_STATE}
          style={{ width: "100%", height: "100%" }}
          // mapStyle="https://tiles.openfreemap.org/styles/liberty"
          mapStyle="https://api.maptiler.com/maps/basic-v2/style.json?key=89LhKWlaYuQbrWr58XYF"
          onLoad={onMapLoad}
          onMoveEnd={updateBounds}
          onClick={(e) => {
            // Gérer le clic sur la carte
            if (e.features && e.features.length > 0) {
              onLayerClick(e);
            }
          }}
          reuseMaps
        >
          <NavigationControl position="top-right" />

          {geoJsonData && (
            <Source
              id="pois-source"
              type="geojson"
              data={geoJsonData}
              cluster
              clusterRadius={50}
            >
              {/* Cercle de base pour chaque point */}

              {/* <Layer
                id="poi-circles"
                type="circle"
                paint={{
                  "circle-radius": 10,
                  "circle-color": "#11b4da",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#fff",
                }}
                filter={["has", "point_count"]}
              /> */}
              <Layer
                id="poi-circles"
                type="symbol"
                layout={{
                  // "text-field": "{point_count_abbreviated}",
                  "text-field": "foo",
                  "text-font": [
                    "literal",
                    [
                      "Open Sans Regular",
                      "Open Sans Bold",
                      "Arial Unicode MS Bold",
                      "sans-serif",
                      "DIN Offc Pro Italic",
                      "Arial Unicode MS Regular",
                    ],
                  ],
                  "text-size": 10,
                  "icon-allow-overlap": true,
                  "text-allow-overlap": true,
                  "text-ignore-placement": true,
                }}
                paint={{
                  "text-color": "#000000",
                }}
                // filter={["has", "point_count"]}
              />

              {/* <Layer
                id="poi-circles"
                type="circle"
                paint={{
                  "circle-radius": 4,
                  "circle-color": "#11b4da",
                  "circle-stroke-width": 1,
                  "circle-stroke-color": "#fff",
                }}
                filter={["!", ["has", "point_count"]]}
              /> */}

              {/* Symboles avec images */}
              {/* <Layer
                id="poi-symbols"
                type="symbol"
                layout={{
                  "icon-image": [
                    "case",
                    ["has", ["get", "id"], ["literal", loadedImages]],
                    ["get", "id"],
                    "default-marker",
                  ],
                  "icon-allow-overlap": true,
                  "icon-size": 0.5,
                }}
                filter={["!", ["has", "point_count"]]}
              /> */}
            </Source>
          )}

          {popupInfo !== null && (
            <PoiPopup
              popupInfo={popupInfo}
              onClose={() => {
                setPopupInfo(null);
              }}
            />
          )}
        </MapLibre>
        <div className="absolute bottom-4 left-4 rounded bg-white px-2 py-1 shadow">
          Zoom: {zoomLevel.toFixed(2)}
        </div>
        <div className="absolute bottom-4 right-4 rounded bg-white px-2 py-1 shadow">
          Bounds: {bounds.minLat.toFixed(4)}, {bounds.minLng.toFixed(4)} -{" "}
          {bounds.maxLat.toFixed(4)}, {bounds.maxLng.toFixed(4)}
        </div>
        <div className="absolute top-4 right-4 rounded bg-white px-2 py-1 shadow">
          POIs: {poisData?.data?.length || 0} | Images: {loadingStatus.loaded}/
          {loadingStatus.total} | Échecs: {loadingStatus.failed}
        </div>
        <div className="absolute top-4 left-4 rounded bg-white px-2 py-1 shadow">
          File d'attente: {imageQueueRef.current.length} | Requêtes en cours:{" "}
          {pendingRequestsRef.current}
        </div>
      </div>
    </div>
  );
}
