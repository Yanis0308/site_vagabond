import {
  Camera,
  CircleLayer,
  Images,
  type MapState,
  MapView,
  ShapeSource,
  SymbolLayer,
} from "@rnmapbox/maps";
import { type FilterExpression } from "@rnmapbox/maps/src/utils/MapboxStyles";
import { router } from "expo-router";
import { getDistance } from "geolib";
import { type ReactElement, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import colors from "tailwindcss/colors";

import { MapButtons } from "@/components/custom-ui/MapButtons";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { PlaceDetailsSheet } from "@/components/place-details/PlaceDetailsSheet";
import { Box } from "@/components/ui/box";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useMapLogic } from "@/hooks/maps/useMapLogic";
import { useImageLoader } from "@/hooks/other/useImageLoader";
import { CLUSTER_MAX_ZOOM, CLUSTER_RADIUS } from "@/utils/bbox";
import { logger } from "@/utils/logger";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- will fix later
const bearingImage = require("@/assets/images/bearing-icon.png");

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- page file
export default function MapsTab(): ReactElement {
  const { t } = useTranslation("common");

  // Utilisation du hook personnalisé pour toute la logique de la carte
  const {
    placesData,
    customShape,
    selectedPlaceInfo,
    imagesUrls,
    zoom,
    mapRef,
    cameraRef,
    isFetchingPlaces,
    onMapIdle,
    onPress,
    setSelectedPlaceInfo,
    moveToUserLocation,
    resetMapOrientation,
    userLocation,
  } = useMapLogic();

  const [headingRealtime, setHeadingRealtime] = useState(0);

  // Filtres pour les couches
  const clusterFilter = useMemo<FilterExpression>(
    () => ["has", "point_count"] as const,
    [],
  );
  const unclusteredFilter = useMemo<FilterExpression>(
    () => ["!", ["has", "point_count"]] as const,
    [],
  );

  const onImageMissing = useCallback((imageKey: string) => {
    logger("🎞️🎞️🎞️ image missing", imageKey);
  }, []);

  const { imagesLoaded, pendingRequests, queueLength } =
    useImageLoader(imagesUrls);

  const images = useMemo(
    () => ({
      //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- will fix later
      bearingImage: bearingImage,
    }),
    [],
  );
  const onClose = useCallback(() => {
    setSelectedPlaceInfo(null);
  }, [setSelectedPlaceInfo]);

  const [isCentered, setIsCentered] = useState(true);

  const onCameraChanged = useCallback(
    (mapState: MapState) => {
      const { center, heading } = mapState.properties;
      setHeadingRealtime(heading);
      if (userLocation !== null && userLocation !== undefined) {
        const distance = getDistance(
          { latitude: center[1] ?? 0, longitude: center[0] ?? 0 },
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
        );
        setIsCentered(distance < 20); // 20 meters of tolerance
      }
    },
    [userLocation],
  );

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor="transparent"
      withHeader={false}
      isTabScreen={true}
    >
      <Box className="flex-1">
        <PlaceDetailsSheet
          place={selectedPlaceInfo}
          // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
          onPressLink={(): void => {
            router.push({
              pathname: "/validate-place/take-photo",
            });
          }}
          onClose={onClose}
        />

        {isFetchingPlaces && (
          <Box className="absolute left-0 top-0 z-50 flex items-center justify-center">
            <Spinner
              size="large"
              color={colors.gray[500]}
              className="bg-red-500"
            />
          </Box>
        )}

        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          styleURL="mapbox://styles/glutomax/cm8affmx4003a01qsd3aj52bi" // add "/draft" to use the draft style
          // onRegionDidChange={onRegionDidChange}
          onMapIdle={onMapIdle}
          onCameraChanged={onCameraChanged}
          projection={"globe"}
          compassEnabled={false}
          compassFadeWhenNorth={true}
          scaleBarEnabled={false}
        >
          <Camera pitch={0} heading={0} ref={cameraRef} />
          {/* <LocationPuck
            puckBearingEnabled
            puckBearing="heading"
            bearingImage={Platform.OS === "ios" ? undefined : "bearingImage"}
            // pulsing={pulsing} currently create bug to get map event https://github.com/rnmapbox/maps/issues/2902
          /> */}
          <Images images={images} />
          <Images images={imagesLoaded} onImageMissing={onImageMissing} />
          <ShapeSource
            id="pois"
            shape={customShape}
            onPress={onPress}
            cluster
            clusterMaxZoomLevel={CLUSTER_MAX_ZOOM}
            clusterRadius={CLUSTER_RADIUS}
            // clusterProperties={clusterProperties}
          >
            <CircleLayer
              id="clusters"
              sourceID="pois"
              filter={clusterFilter}
              style={{
                circleColor: [
                  "step",
                  ["get", "point_count"],
                  "#51bbd6", // couleur pour clusters de petite taille
                  20,
                  "#f1f075", // couleur pour clusters de taille moyenne (>= 20 points)
                  50,
                  "#f28cb1", // couleur pour grands clusters (>= 50 points)
                ],
                circleRadius: [
                  "step",
                  ["get", "point_count"],
                  15, // rayon pour clusters de petite taille
                  20,
                  20, // rayon pour clusters de taille moyenne
                  50,
                  25, // rayon pour grands clusters
                ],
                circleStrokeWidth: 2,
                circleStrokeColor: "#ffffff",
              }}
            />

            {/* Couche pour le compte de points dans les clusters */}
            <SymbolLayer
              id="cluster-count"
              sourceID="pois"
              filter={clusterFilter}
              style={{
                textField: "{point_count_abbreviated}",
                textFont: ["Open Sans Bold"],
                textSize: 12,
                textColor: "#ffffff",
                // textAllowOverlap: true,
                // iconAllowOverlap: true,
              }}
            />

            {/* Couche pour les points non clusterisés */}
            <CircleLayer
              id="unclustered-point"
              sourceID="pois"
              filter={unclusteredFilter}
              style={{
                circleColor: [
                  "case",
                  ["get", "isVisited"],
                  "#10b981", // vert pour les POI visités (green-500)
                  "#9b4dca", // bleu pour les POI non visités (couleur originale)
                ],
                circleRadius: 8,
                circleStrokeWidth: 1,
                circleStrokeColor: "#fff",
              }}
            />

            {/* Couche pour les icônes sur les points non clusterisés */}
            <SymbolLayer
              id="custom-marker-symbol"
              sourceID="pois"
              filter={unclusteredFilter}
              style={{
                iconImage: [
                  "case",
                  ["has", ["get", "imageUrl"], ["literal", imagesLoaded]],
                  ["get", "imageUrl"],
                  "empty",
                ],
                iconAllowOverlap: true,
              }}
              minZoomLevel={CLUSTER_MAX_ZOOM}
            />
          </ShapeSource>
        </MapView>

        <MapButtons
          onCompassPress={resetMapOrientation}
          onLocatePress={moveToUserLocation}
          isCentered={isCentered}
          heading={headingRealtime}
        />
        {/* Indicateurs de chargement */}
        <View
          style={{
            position: "absolute",
            top: 20,
            left: 10,
            padding: 5,
            borderRadius: 5,
          }}
        >
          <Text>{t("zoom", { zoom })}</Text>
          <Text>{t("pois", { pois: placesData?.length ?? 0 })}</Text>
          <Text>{t("img_queue", { queueLength })}</Text>
          <Text>{t("img_loading", { pendingRequests })}</Text>
          <Text>
            {t("clustering", {
              enabled: zoom !== null && zoom < CLUSTER_MAX_ZOOM + 1,
            })}
          </Text>
        </View>
      </Box>
    </CustomScreenContainer>
  );
}
