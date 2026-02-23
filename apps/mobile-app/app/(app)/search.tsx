import type { SearchResult } from "@vagabond/shared-utils";
import { router } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { type ReactElement, useRef } from "react";
import { Keyboard, TouchableOpacity } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { KeyboardDismissPressable } from "@/components/search-bar/KeyboardDismissPressable";
import {
  SearchHeader,
  type SearchHeaderRef,
} from "@/components/search-bar/SearchHeader";
import { SearchResultsList } from "@/components/search-bar/SearchResultsList";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { View } from "@/components/ui/view";
import { queryClient } from "@/constants/QueryClient";
import { usePlaceSelection } from "@/hooks/other/usePlaceSelection";
import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";
import { useSearch } from "@/hooks/queries/useSearch";
import { searchPlaces } from "@/http/search";
import { mapService } from "@/services/MapService";
import {
  type RecentSearch,
  useRecentSearches,
} from "@/stores/recentSearchesAtom";
import { useSearchTerm } from "@/stores/searchTermAtom";
export default function SearchScreen(): ReactElement {
  const {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearAllRecentSearches,
  } = useRecentSearches();
  const { setSelectedPlace } = usePlaceSelection();
  const { searchTerm, setSearchTerm } = useSearchTerm();
  const safeAreaInsets = useSafeAreaCustom();
  const searchHeaderRef = useRef<SearchHeaderRef>(null);

  const { data: searchResults, isLoading: searchIsLoading } = useSearch();

  const dismissKeyboardAndBlur = (): void => {
    Keyboard.dismiss();
    searchHeaderRef.current?.blur();
  };

  const handleSelectResult = (result: SearchResult): void => {
    // Add to recent searches
    void addRecentSearch(result);

    // Prefetch the search query in background so it's ready when user returns
    // This uses the same queryKey as useSearch hook
    void queryClient.prefetchQuery({
      queryKey: ["search", result.name],
      queryFn: async () => {
        return await searchPlaces(result.name);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes (same as useSearch)
    });

    // Dismiss keyboard and blur input
    dismissKeyboardAndBlur();

    // Store the selected result name to display in the search bar on the map screen
    setSearchTerm(result.name);

    // If it's a POI, store the ID to select it once places are loaded
    const isPoi = result.type === "POI";
    if (isPoi) {
      setSelectedPlace({
        id: result.id,
        name: result.name,
        filterLevel: "UNKNOWN",
        coords: result.coordinates,
      });
    } else {
      setSelectedPlace(null);
    }

    // Store the pending move - will be executed when map screen is focused
    mapService.setPendingMove(result.coordinates, isPoi);

    // Navigate back to map screen
    router.back();
  };

  const handleSelectRecentSearch = (search: RecentSearch): void => {
    handleSelectResult(search.result);
  };

  const handleBack = (): void => {
    dismissKeyboardAndBlur();
    router.back();
  };

  const handleSubmitEditing = (): void => {
    // Select first result if available
    if (searchResults?.[0] !== undefined) {
      handleSelectResult(searchResults[0]);
    }
  };

  const showRecentSearches = searchTerm.length < 2 && recentSearches.length > 0;
  const showSearchResults = searchTerm.length >= 2;

  const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background[100].hex}
      withHeader={false}
      isTabScreen={false}
      withTopSafeArea={false}
    >
      <KeyboardDismissPressable onDismiss={dismissKeyboardAndBlur}>
        <View
          className="flex-1"
          style={{
            paddingTop: safeAreaInsets.top + 16,
            paddingBottom: safeAreaInsets.bottom,
          }}
        >
          <SearchHeader
            ref={searchHeaderRef}
            onBack={handleBack}
            placeholder="Rechercher sur la carte"
            editable={true}
            onSubmitEditing={handleSubmitEditing}
          />

          <View
            className="flex-1"
            style={[
              {
                paddingTop: 16,
                backgroundColor: themeColors.background[100].hex,
              },
            ]}
          >
            {/* Recent Searches */}
            {showRecentSearches && (
              <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between border-b border-background-200 px-4 py-1.5">
                  <CustomText className="text-base font-semibold">
                    {"Recherches récentes"}
                  </CustomText>

                  <TouchableOpacity
                    onPress={clearAllRecentSearches}
                    className="flex-row items-center"
                    accessibilityRole="button"
                    accessibilityLabel="Effacer toutes les recherches récentes"
                    hitSlop={hitSlop}
                  >
                    <Trash2
                      size={16}
                      color={themeColors.secondary[500].hex}
                      style={{ marginRight: 4 }}
                    />
                    <CustomText className="text-sm font-medium text-secondary-500">
                      {"Tout effacer"}
                    </CustomText>
                  </TouchableOpacity>
                </View>

                {/* Recent searches list */}
                <SearchResultsList
                  data={recentSearches}
                  resultType="recentSearches"
                  onBlurInput={dismissKeyboardAndBlur}
                  onSelectRecentSearch={handleSelectRecentSearch}
                  onRemoveRecentSearch={removeRecentSearch}
                />
              </View>
            )}

            {/* Search Results */}
            {showSearchResults && (
              <SearchResultsList
                data={searchResults}
                resultType="searchResults"
                onBlurInput={dismissKeyboardAndBlur}
                onSelectResult={handleSelectResult}
                isLoading={searchIsLoading}
              />
            )}

            {/* Empty state when no query and no recent searches */}
            {!showRecentSearches && !showSearchResults && (
              <View className="flex-1 items-center p-8">
                <CustomText className="text-center text-base text-typography-600">
                  {"Recherchez un lieu, une ville ou un point d'intérêt"}
                </CustomText>
              </View>
            )}
          </View>
        </View>
      </KeyboardDismissPressable>
    </CustomScreenContainer>
  );
}
