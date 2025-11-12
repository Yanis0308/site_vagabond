import { getAuth } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { FlashList } from "@shopify/flash-list";
import { type ReactElement, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { VStack } from "@/components/ui/vstack";
import { ValidatedPlaceCard } from "@/components/ValidatedPlaceCard";
import { useZoneHierarchy } from "@/hooks/other/useZoneHierarchy";
import { useUserZoneStats } from "@/hooks/queries/useZonesStats";
import { logger } from "@/utils/logger";
import type { BriefVisitedPoiType } from "@/utils/types";

// Types utilitaires dérivés du hook useZoneHierarchy
type CountryType = ReturnType<typeof useZoneHierarchy>[number];
type RegionType = CountryType["regions"][number];
type DepartementType = RegionType["departements"][number];
type CityType = DepartementType["cities"][number];

// Type union pour les éléments de liste plate
type ListItem =
  | { itemType: "COUNTRY"; data: CountryType }
  | { itemType: "REGION"; data: RegionType; indent: number }
  | { itemType: "DEPARTEMENT"; data: DepartementType; indent: number }
  | { itemType: "CITY"; data: CityType; indent: number }
  | { itemType: "POI"; data: BriefVisitedPoiType; indent: number };

// Fonction pour transformer la hiérarchie en liste plate
function flattenHierarchy(countries: CountryType[]): ListItem[] {
  const result: ListItem[] = [];

  for (const country of countries) {
    result.push({ itemType: "COUNTRY", data: country });

    for (const region of country.regions) {
      result.push({ itemType: "REGION", data: region, indent: 1 });

      for (const departement of region.departements) {
        result.push({
          itemType: "DEPARTEMENT",
          data: departement,
          indent: 2,
        });

        for (const city of departement.cities) {
          result.push({ itemType: "CITY", data: city, indent: 3 });

          for (const poi of city.pois ?? []) {
            result.push({ itemType: "POI", data: poi, indent: 4 });
          }
        }
      }
    }
  }

  return result;
}

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
export default function HomeScreen(): ReactElement {
  const { t } = useTranslation("common");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { data: zonesData } = useUserZoneStats();

  const zoneHierarchy = useZoneHierarchy(zonesData?.zonesStats);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      try {
        // Prevent sign-in with same Google account without asking
        await GoogleSignin.revokeAccess();
      } catch (error) {
        logger("Error GoogleSignin revoking access", error);
      }
      await getAuth().signOut();
    } catch (error) {
      logger("Error signing out", error);
      setIsSigningOut(false);
    }
  }, []);

  const onPress = useCallback(() => void signOut(), [signOut]);

  // Liste plate pour FlashList
  const flatList = useMemo(
    () => flattenHierarchy(zoneHierarchy),
    [zoneHierarchy],
  );

  // Helper pour calculer un pourcentage avec garde division par zéro
  const percentage = useCallback(
    (validated: number, total: number) =>
      total > 0 ? ((validated / total) * 100).toFixed(2).toString() : 0,
    [],
  );

  // Helper pour générer la classe d'indentation
  const getIndentClass = useCallback((indent: number) => {
    const indentMap: Record<number, string> = {
      0: "",
      1: "ml-4",
      2: "ml-6",
      3: "ml-8",
      4: "ml-10",
    };
    return indentMap[indent] ?? "";
  }, []);

  // Rendu d'un pays
  const renderCountryItem = useCallback(
    (country: CountryType) => (
      <CustomText>
        {country.name} -{" "}
        {percentage(country.validatedPoisCount, country.totalPoisCount)}%
      </CustomText>
    ),
    [percentage],
  );

  // Rendu d'une région
  const renderRegionItem = useCallback(
    (region: RegionType, indent: number) => (
      <CustomText className={getIndentClass(indent)}>
        {region.name} -{" "}
        {percentage(region.validatedPoisCount, region.totalPoisCount)}%
      </CustomText>
    ),
    [percentage, getIndentClass],
  );

  // Rendu d'un département
  const renderDepartementItem = useCallback(
    (departement: DepartementType, indent: number) => (
      <CustomText className={getIndentClass(indent)}>
        {departement.name} -{" "}
        {percentage(departement.validatedPoisCount, departement.totalPoisCount)}
        %
      </CustomText>
    ),
    [percentage, getIndentClass],
  );

  // Rendu d'une ville
  const renderCityItem = useCallback(
    (city: CityType, indent: number) => (
      <CustomText className={getIndentClass(indent)}>
        {city.name} - {percentage(city.validatedPoisCount, city.totalPoisCount)}
        %
      </CustomText>
    ),
    [percentage, getIndentClass],
  );

  // Rendu d'un POI
  const renderPoiItem = useCallback(
    (poi: BriefVisitedPoiType, indent: number) => (
      <Box className={getIndentClass(indent)}>
        <ValidatedPlaceCard visitedPoi={poi} />
      </Box>
    ),
    [getIndentClass],
  );

  // RenderItem principal qui switch sur itemType
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      switch (item.itemType) {
        case "COUNTRY":
          return renderCountryItem(item.data);
        case "REGION":
          return renderRegionItem(item.data, item.indent);
        case "DEPARTEMENT":
          return renderDepartementItem(item.data, item.indent);
        case "CITY":
          return renderCityItem(item.data, item.indent);
        case "POI":
          return renderPoiItem(item.data, item.indent);
        default:
          return null;
      }
    },
    [
      renderCountryItem,
      renderRegionItem,
      renderDepartementItem,
      renderCityItem,
      renderPoiItem,
    ],
  );

  const keyExtractor = useCallback((item: ListItem, index: number) => {
    switch (item.itemType) {
      case "COUNTRY":
        return `country-${item.data.name}`;
      case "REGION":
        return `region-${item.data.name}`;
      case "DEPARTEMENT":
        return `departement-${item.data.name}`;
      case "CITY":
        return `city-${item.data.name}`;
      case "POI":
        return `poi-${item.data.id}`;
      default:
        return `item-${index}`;
    }
  }, []);

  const listEmptyComponent = useMemo(
    () => (
      <Box className="flex-1 items-center justify-center py-8">
        <CustomText className="text-gray-500">
          {t("no_validated_places")}
        </CustomText>
      </Box>
    ),
    [t],
  );

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background["200"].hex}
      withHeader={false}
      isTabScreen={true}
    >
      <Box className="flex size-full">
        <VStack className="flex size-full gap-4 p-4">
          {/* Header avec bouton de déconnexion */}
          <Box className="items-center gap-4 py-4">
            <Button
              onPress={onPress}
              isDisabled={isSigningOut}
              action="secondary"
            >
              <ButtonText>{t("sign_out")}</ButtonText>
            </Button>
          </Box>

          {/* Liste des validated places */}
          <VStack className="flex-1">
            <CustomText className="mb-4 text-lg font-semibold">
              {t("validated_places")}
            </CustomText>

            <FlashList
              data={flatList}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              ListEmptyComponent={listEmptyComponent}
            />
          </VStack>
        </VStack>
      </Box>
    </CustomScreenContainer>
  );
}
