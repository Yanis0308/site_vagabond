import type { SearchResult } from "@vagabond/shared-utils";
import { Building2, Clock, MapPin, X } from "lucide-react-native";
import { type ReactElement } from "react";
import { TouchableOpacity } from "react-native";

import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { View } from "@/components/ui/view";

import { CustomText } from "../custom-ui/CustomText";

interface SearchResultItemProps {
  result: SearchResult;
  onPress: () => void;
  onRemove?: () => void;
}

/**
 * Common component to display a search result item
 * Used for both recent searches and current search results
 */
export const SearchResultItem = ({
  result,
  onPress,
  onRemove,
}: SearchResultItemProps): ReactElement => {
  const isRecentSearch = onRemove !== undefined;
  const isPoi = result.type === "POI";
  const locationLabel = isPoi
    ? (result.cityName ?? "Point d'intérêt")
    : (result.departmentName ?? "Ville");

  const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

  const handleRemove = (e: { stopPropagation: () => void }): void => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={
        "flex-row items-center border-b border-background-200 bg-background-50 px-4 py-3"
      }
      activeOpacity={0.5}
      accessibilityRole="button"
      accessibilityLabel={`Sélectionner ${result.name}, ${locationLabel}`}
    >
      {/* Icon */}
      <View className="mr-3">
        {isPoi ? (
          <MapPin
            size={20}
            color={themeColors.primary[500].hex}
            strokeWidth={2}
            accessibilityLabel="Point d'intérêt"
          />
        ) : (
          <Building2
            size={20}
            color={themeColors.secondary[500].hex}
            strokeWidth={2}
            accessibilityLabel="Ville"
          />
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <CustomText className="text-base font-medium text-typography-900">
          {result.name}
        </CustomText>
        <CustomText className="text-xs text-secondary-500">
          {locationLabel}
        </CustomText>
      </View>

      {isRecentSearch && (
        <>
          {/* Clock icon (for recent searches) */}
          <View className="mr-2">
            <Clock
              size={16}
              color={themeColors.typography[400].hex}
              accessibilityLabel="Recherche récente"
            />
          </View>

          {/* Remove button (for recent searches) */}
          <TouchableOpacity
            onPress={handleRemove}
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel="Supprimer cette recherche"
            hitSlop={hitSlop}
          >
            <X size={18} color={themeColors.typography[400].hex} />
          </TouchableOpacity>
        </>
      )}
    </TouchableOpacity>
  );
};
