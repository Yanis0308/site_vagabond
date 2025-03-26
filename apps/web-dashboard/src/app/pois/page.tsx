"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import MapLibre, {
  type MapInstance,
  type MapRef,
  NavigationControl,
} from "@vis.gl/react-maplibre";
import {
  type ReactElement,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Supercluster from "supercluster";

import { selectAllPoisByTags } from "@/query/select";

import { ClusterMarker, type PoiCluster } from "../../components/ClusterMarker";
import { type FilterValue, PoiFilters } from "../../components/PoiFilters";
import { PoiPopup } from "../../components/PoiPopup";
import { INITIAL_VIEW_STATE } from "./constants";
import { type RawPoi } from "./types";

const initFilters = (allPois: RawPoi[]): Map<string, FilterValue> => {
  const typesFilters = new Map<string, FilterValue>();
  for (const poi of allPois) {
    for (const tag in poi.tags) {
      if (["leisure", "tourism", "historic", "amenity"].includes(tag)) {
        const key = `${tag}-${poi.tags[tag]}`;
        const value = typesFilters.get(key);
        if (value !== undefined) {
          value.count++;
        } else {
          typesFilters.set(key, {
            checked: false,
            count: 1,
            tagName: tag,
            tagValue: poi.tags[tag] ?? "",
          });
        }
      }
    }
  }
  return typesFilters;
};

export default function PoisPage(): ReactElement {
  const [allPois, setAllPois] = useState<RawPoi[]>([]);
  const [popupInfo, setPopupInfo] = useState<{
    poi: RawPoi;
    longitude: number;
    latitude: number;
  } | null>(null);
  const [clusters, setClusters] = useState<PoiCluster[]>([]);
  const [supercluster, setSupercluster] = useState<Supercluster | null>(null);
  const mapRef = useRef<MapInstance>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(INITIAL_VIEW_STATE.zoom);

  // Modifions cette partie pour créer un état pour les POIs filtrés
  const [filteredPois, setFilteredPois] = useState<RawPoi[]>([]);

  // Chargement initial des POIs
  useEffect(() => {
    const loadPois = async (): Promise<void> => {
      const pois = await selectAllPoisByTags();
      setAllPois(pois);
      setFilteredPois([]); // Initialiser les POIs filtrés
      setTypeFilters(initFilters(pois));
    };

    void loadPois();
  }, []);

  const [typeFilters, setTypeFilters] = useState<Map<string, FilterValue>>(
    new Map(),
  );

  // Effet pour filtrer les POIs
  useEffect(() => {
    const filtered = allPois.filter((poi) => {
      return Object.entries(poi.tags).some(([tag, value]) => {
        const key = `${tag}-${value}`;
        return typeFilters.get(key)?.checked ?? false;
      });
    });
    setFilteredPois(filtered);
  }, [allPois, typeFilters]);

  // Modifier l'effet de Supercluster pour utiliser filteredPois au lieu de allPois
  useEffect(() => {
    const cluster = new Supercluster({
      radius: 20,
      maxZoom: 12,
      minPoints: 3,
    });

    const points = filteredPois.map((poi) => ({
      type: "Feature" as const,
      properties: { ...poi },
      geometry: {
        type: "Point" as const,
        coordinates: [poi.longitude, poi.latitude],
      },
    }));

    cluster.load(points);
    setSupercluster(cluster);
  }, [filteredPois]); // Dépendance changée à filteredPois

  // Composant pour afficher un cluster

  // Remplacer le rendu des markers par les clusters
  const clusterMarkers = useMemo(() => {
    return clusters.map((cluster) => (
      <ClusterMarker
        key={cluster.id}
        cluster={cluster}
        mapRef={mapRef}
        supercluster={supercluster}
        setPopupInfo={setPopupInfo}
      />
    ));
  }, [clusters, supercluster]);

  useEffect(() => {
    if (supercluster === null || mapRef.current === null) return;

    const updateClusters = (): void => {
      if (mapRef.current === null) return;

      const bounds = mapRef.current.getBounds();
      const zoom = Math.floor(mapRef.current.getZoom());
      setZoomLevel(zoom);

      const clusters = supercluster.getClusters(
        [
          bounds.getWest() - 0.1,
          bounds.getSouth() - 0.1,
          bounds.getEast() + 0.1,
          bounds.getNorth() + 0.1,
        ],
        zoom,
      );
      setClusters(clusters as PoiCluster[]);
    };

    mapRef.current.on("moveend", updateClusters);

    updateClusters();

    return (): void => {
      mapRef.current?.off("moveend", updateClusters);
    };
  }, [supercluster, setClusters, mapRef]);

  return (
    <div className="flex gap-2">
      {allPois.length === 0 ? (
        <div className="flex flex-col gap-2">
          <p>Loading pois...</p>
        </div>
      ) : (
        <PoiFilters typeFilters={typeFilters} setTypeFilters={setTypeFilters} />
      )}
      <div className="relative h-screen w-[80vw]">
        <MapLibre
          ref={mapRef as unknown as RefObject<MapRef>}
          initialViewState={INITIAL_VIEW_STATE}
          style={{ width: "100%", height: "100%" }}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
        >
          <NavigationControl position="top-right" />
          {clusterMarkers}
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
      </div>
    </div>
  );
}
