import { FlashList } from "@shopify/flash-list";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react-native";
import { memo, type ReactElement, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Spinner } from "@/components/ui/spinner";
import { useVisitedPoisByBoundary } from "@/hooks/queries/useVisitedPoisByBoundary";

import { CustomText } from "../custom-ui/CustomText";
import { ProfilePoiItem } from "./ProfilePoiItem";
import type {
  CityType,
  CountryType,
  DepartementType,
  RegionType,
} from "./utils";

interface ProfileHierarchicalAccordionProps {
  countries: CountryType[];
  allowVisitedPoiNavigation: boolean;
  allowProfileEdit: boolean;
  // Si défini, charge les visited POIs d'un autre user (profil tiers).
  userId?: string;
}

type FlatItem =
  | { type: "region"; data: RegionType; level: 0; id: string }
  | { type: "dept"; data: DepartementType; level: 1; id: string }
  | { type: "city"; data: CityType; level: 2; id: string }
  | { type: "cityPois"; cityId: string; level: 3; id: string };

const flattenHierarchy = (
  countries: CountryType[],
  expandedRegions: Set<string>,
  expandedDepartements: Set<string>,
  expandedCities: Set<string>,
): FlatItem[] => {
  const result: FlatItem[] = [];

  for (const country of countries) {
    for (const region of country.regions) {
      result.push({
        type: "region",
        data: region,
        level: 0,
        id: `region-${region.zoneId}`,
      });

      if (expandedRegions.has(region.zoneId)) {
        for (const dept of region.departements) {
          result.push({
            type: "dept",
            data: dept,
            level: 1,
            id: `dept-${dept.zoneId}`,
          });

          if (expandedDepartements.has(dept.zoneId)) {
            for (const city of dept.cities) {
              result.push({
                type: "city",
                data: city,
                level: 2,
                id: `city-${city.zoneId}`,
              });

              if (expandedCities.has(city.zoneId)) {
                result.push({
                  type: "cityPois",
                  cityId: city.zoneId,
                  level: 3,
                  id: `pois-${city.zoneId}`,
                });
              }
            }
          }
        }
      }
    }
  }

  return result;
};

const RegionItem = memo(
  ({
    region,
    isExpanded,
    onToggle,
  }: {
    region: RegionType;
    isExpanded: boolean;
    onToggle: () => void;
  }): ReactElement => {
    const { t } = useTranslation("common");
    const title = `📌 ${region.name} - ${region.completedSubzonesCount}/${region.totalSubzonesCount} ${t("departements")}`;

    return (
      <Pressable onPress={onToggle}>
        <Box className="bg-white">
          <Box className="flex w-full flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
            <CustomText className="flex-1 text-sm font-medium">
              {title}
            </CustomText>
            {isExpanded ? (
              <ChevronUpIcon size={18} />
            ) : (
              <ChevronDownIcon size={18} />
            )}
          </Box>
        </Box>
      </Pressable>
    );
  },
);
RegionItem.displayName = "RegionItem";

const DepartementItem = memo(
  ({
    departement,
    isExpanded,
    onToggle,
  }: {
    departement: DepartementType;
    isExpanded: boolean;
    onToggle: () => void;
  }): ReactElement => {
    const { t } = useTranslation("common");
    const title = `📍 ${departement.name} - ${departement.completedSubzonesCount}/${departement.totalSubzonesCount} ${t("cities")}`;

    return (
      <Pressable onPress={onToggle}>
        <Box className="bg-white pl-4">
          <Box className="flex w-full flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
            <CustomText className="flex-1 text-sm">{title}</CustomText>
            {isExpanded ? (
              <ChevronUpIcon size={18} />
            ) : (
              <ChevronDownIcon size={18} />
            )}
          </Box>
        </Box>
      </Pressable>
    );
  },
);
DepartementItem.displayName = "DepartementItem";

const CityItem = memo(
  ({
    city,
    isExpanded,
    onToggle,
  }: {
    city: CityType;
    isExpanded: boolean;
    onToggle: () => void;
  }): ReactElement => {
    const { t } = useTranslation("common");
    const title = `🏘️ ${city.name} - ${city.validatedPoisCount}/${city.totalPoisCount} ${t("pois_abbreviation")}`;

    return (
      <Pressable onPress={onToggle}>
        <Box className="bg-white pl-6">
          <Box className="flex w-full flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
            <CustomText className="flex-1 text-sm">{title}</CustomText>
            {isExpanded ? (
              <ChevronUpIcon size={18} />
            ) : (
              <ChevronDownIcon size={18} />
            )}
          </Box>
        </Box>
      </Pressable>
    );
  },
);
CityItem.displayName = "CityItem";

// Sous-composant qui fetch les Visited POIs d'une ville quand elle est expanded.
// Lazy : pas de fetch tant que la ville reste collapsed (la query n'existe pas dans flatItems).
const CityPoisList = memo(
  ({
    cityId,
    allowVisitedPoiNavigation,
    allowProfileEdit,
    userId,
  }: {
    cityId: string;
    allowVisitedPoiNavigation: boolean;
    allowProfileEdit: boolean;
    userId?: string;
  }): ReactElement => {
    const { t } = useTranslation("common");
    const {
      items,
      fetchNextPage,
      hasNextPage,
      isFetching,
      isFetchingNextPage,
      isLoading,
    } = useVisitedPoisByBoundary({
      boundaryId: cityId,
      userId,
    });

    // CityPoisList est une suite de ProfilePoiItem dans un FlashList parent.
    return (
      <Box className="pl-6">
        {isLoading ? (
          <Box className="w-full items-center justify-center px-4 py-6">
            <Spinner size="small" color={themeColors.primary[500].hex} />
          </Box>
        ) : null}
        {items.map((vp) => (
          <ProfilePoiItem
            key={vp.id}
            poi={{
              id: vp.id,
              poiId: vp.poiId,
              name: vp.name,
              coords: vp.coords,
              isDisabled: vp.isDisabled,
              createdAt: vp.createdAt,
              comment: vp.comment,
              rating: vp.rating,
              imageKey: vp.imageKey,
            }}
            allowNavigation={allowVisitedPoiNavigation}
            allowProfileEdit={allowProfileEdit}
          />
        ))}
        {isFetchingNextPage ? (
          <Box className="w-full items-center justify-center p-4">
            <Spinner size="small" color={themeColors.primary[500].hex} />
          </Box>
        ) : hasNextPage ? (
          <Pressable
            onPress={() => {
              void fetchNextPage();
            }}
            disabled={isFetching}
          >
            <Box className="mx-4 my-2 flex-row items-center justify-center gap-1 rounded-lg bg-primary-50 px-4 py-3">
              <CustomText className="text-sm font-semibold text-primary-600">
                {t("load_more")}
              </CustomText>
              <ChevronDownIcon size={16} color={themeColors.primary[600].hex} />
            </Box>
          </Pressable>
        ) : null}
      </Box>
    );
  },
);
CityPoisList.displayName = "CityPoisList";

export const ProfileHierarchicalAccordion = memo(
  ({
    countries,
    allowVisitedPoiNavigation,
    allowProfileEdit,
    userId,
  }: ProfileHierarchicalAccordionProps): ReactElement => {
    // v2 : toutes les villes collapsed par défaut.
    // L'user expand explicitement → fetch des POIs déclenché à ce moment-là.
    const [expandedRegions, setExpandedRegions] = useState<Set<string>>(
      new Set(),
    );
    const [expandedDepartements, setExpandedDepartements] = useState<
      Set<string>
    >(new Set());
    const [expandedCities, setExpandedCities] = useState<Set<string>>(
      new Set(),
    );

    const toggleRegion = useCallback((regionId: string) => {
      setExpandedRegions((prev) => {
        const next = new Set(prev);
        if (next.has(regionId)) next.delete(regionId);
        else next.add(regionId);
        return next;
      });
    }, []);

    const toggleDepartement = useCallback((deptId: string) => {
      setExpandedDepartements((prev) => {
        const next = new Set(prev);
        if (next.has(deptId)) next.delete(deptId);
        else next.add(deptId);
        return next;
      });
    }, []);

    const toggleCity = useCallback((cityId: string) => {
      setExpandedCities((prev) => {
        const next = new Set(prev);
        if (next.has(cityId)) next.delete(cityId);
        else next.add(cityId);
        return next;
      });
    }, []);

    const flatItems = useMemo(
      () =>
        flattenHierarchy(
          countries,
          expandedRegions,
          expandedDepartements,
          expandedCities,
        ),
      [countries, expandedRegions, expandedDepartements, expandedCities],
    );

    const renderItem = useCallback(
      ({ item }: { item: FlatItem }) => {
        switch (item.type) {
          case "region":
            return (
              <RegionItem
                region={item.data}
                isExpanded={expandedRegions.has(item.data.zoneId)}
                onToggle={() => {
                  toggleRegion(item.data.zoneId);
                }}
              />
            );
          case "dept":
            return (
              <DepartementItem
                departement={item.data}
                isExpanded={expandedDepartements.has(item.data.zoneId)}
                onToggle={() => {
                  toggleDepartement(item.data.zoneId);
                }}
              />
            );
          case "city":
            return (
              <CityItem
                city={item.data}
                isExpanded={expandedCities.has(item.data.zoneId)}
                onToggle={() => {
                  toggleCity(item.data.zoneId);
                }}
              />
            );
          case "cityPois":
            return (
              <CityPoisList
                cityId={item.cityId}
                allowVisitedPoiNavigation={allowVisitedPoiNavigation}
                allowProfileEdit={allowProfileEdit}
                userId={userId}
              />
            );
          default:
            return <Box />;
        }
      },
      [
        expandedRegions,
        expandedDepartements,
        expandedCities,
        toggleRegion,
        toggleDepartement,
        toggleCity,
        allowVisitedPoiNavigation,
        allowProfileEdit,
        userId,
      ],
    );

    const keyExtractor = useCallback((item: FlatItem) => item.id, []);

    return (
      <Box className="w-full bg-white shadow-none">
        <FlashList
          data={flatItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
        />
      </Box>
    );
  },
);

ProfileHierarchicalAccordion.displayName = "ProfileHierarchicalAccordion";
