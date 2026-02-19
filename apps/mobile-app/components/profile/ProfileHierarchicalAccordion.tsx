import { FlashList } from "@shopify/flash-list";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react-native";
import { memo, type ReactElement, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { Box } from "@/components/ui/box";
import type { BriefVisitedPoiType } from "@/utils/types";

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
}

// Types pour les items plats
type FlatItem =
  | { type: "region"; data: RegionType; level: 0; id: string }
  | { type: "dept"; data: DepartementType; level: 1; id: string }
  | { type: "city"; data: CityType; level: 2; id: string }
  | { type: "poi"; data: BriefVisitedPoiType; level: 3; id: string };

// Fonction pour aplatir la hiérarchie
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
                const pois = city.pois;
                for (const poi of pois) {
                  result.push({
                    type: "poi",
                    data: poi,
                    level: 3,
                    id: `poi-${poi.id}`,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return result;
};

// Composant pour rendre un item de région
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

// Composant pour rendre un item de département
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

// Composant pour rendre un item de ville
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

// Composant pour rendre un item plat
const FlatItemRenderer = memo(
  ({
    item,
    expandedRegions,
    expandedDepartements,
    expandedCities,
    toggleRegion,
    toggleDepartement,
    toggleCity,
    allowVisitedPoiNavigation,
  }: {
    item: FlatItem;
    expandedRegions: Set<string>;
    expandedDepartements: Set<string>;
    expandedCities: Set<string>;
    toggleRegion: (id: string) => void;
    toggleDepartement: (id: string) => void;
    toggleCity: (id: string) => void;
    allowVisitedPoiNavigation: boolean;
  }): ReactElement => {
    // Create callbacks before switch to avoid hook rule violations
    const regionToggle = useCallback(() => {
      if (item.type === "region") {
        toggleRegion(item.data.zoneId);
      }
    }, [item, toggleRegion]);

    const deptToggle = useCallback(() => {
      if (item.type === "dept") {
        toggleDepartement(item.data.zoneId);
      }
    }, [item, toggleDepartement]);

    const cityToggle = useCallback(() => {
      if (item.type === "city") {
        toggleCity(item.data.zoneId);
      }
    }, [item, toggleCity]);

    switch (item.type) {
      case "region":
        return (
          <RegionItem
            region={item.data}
            isExpanded={expandedRegions.has(item.data.zoneId)}
            onToggle={regionToggle}
          />
        );
      case "dept":
        return (
          <DepartementItem
            departement={item.data}
            isExpanded={expandedDepartements.has(item.data.zoneId)}
            onToggle={deptToggle}
          />
        );
      case "city":
        return (
          <CityItem
            city={item.data}
            isExpanded={expandedCities.has(item.data.zoneId)}
            onToggle={cityToggle}
          />
        );
      case "poi":
        return (
          <Box className="pl-6">
            <ProfilePoiItem
              poi={item.data}
              allowNavigation={allowVisitedPoiNavigation}
            />
          </Box>
        );
      default:
        return <Box />;
    }
  },
);

FlatItemRenderer.displayName = "FlatItemRenderer";

export const ProfileHierarchicalAccordion = memo(
  ({
    countries,
    allowVisitedPoiNavigation,
  }: ProfileHierarchicalAccordionProps): ReactElement => {
    // Initialize all cities as expanded by default
    const defaultExpandedCities = useMemo(() => {
      const citiesSet = new Set<string>();
      for (const country of countries) {
        for (const region of country.regions) {
          for (const dept of region.departements) {
            for (const city of dept.cities) {
              citiesSet.add(city.zoneId);
            }
          }
        }
      }
      return citiesSet;
    }, [countries]);

    const [expandedRegions, setExpandedRegions] = useState<Set<string>>(
      new Set(),
    );
    const [expandedDepartements, setExpandedDepartements] = useState<
      Set<string>
    >(new Set());
    const [expandedCities, setExpandedCities] = useState<Set<string>>(
      defaultExpandedCities,
    );

    // Fonction pour basculer l'expansion d'une région
    const toggleRegion = useCallback((regionId: string) => {
      setExpandedRegions((prev) => {
        const next = new Set(prev);
        if (next.has(regionId)) {
          next.delete(regionId);
        } else {
          next.add(regionId);
        }
        return next;
      });
    }, []);

    // Fonction pour basculer l'expansion d'un département
    const toggleDepartement = useCallback((deptId: string) => {
      setExpandedDepartements((prev) => {
        const next = new Set(prev);
        if (next.has(deptId)) {
          next.delete(deptId);
        } else {
          next.add(deptId);
        }
        return next;
      });
    }, []);

    // Fonction pour basculer l'expansion d'une ville
    const toggleCity = useCallback((cityId: string) => {
      setExpandedCities((prev) => {
        const next = new Set(prev);
        if (next.has(cityId)) {
          next.delete(cityId);
        } else {
          next.add(cityId);
        }
        return next;
      });
    }, []);

    // Aplatir la hiérarchie en une seule liste
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

    // Fonction pour rendre chaque item
    const renderItem = useCallback(
      ({ item }: { item: FlatItem }) => (
        <FlatItemRenderer
          item={item}
          expandedRegions={expandedRegions}
          expandedDepartements={expandedDepartements}
          expandedCities={expandedCities}
          toggleRegion={toggleRegion}
          toggleDepartement={toggleDepartement}
          toggleCity={toggleCity}
          allowVisitedPoiNavigation={allowVisitedPoiNavigation}
        />
      ),
      [
        expandedRegions,
        expandedDepartements,
        expandedCities,
        toggleRegion,
        toggleDepartement,
        toggleCity,
        allowVisitedPoiNavigation,
      ],
    );

    // Extracteur de clé
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
