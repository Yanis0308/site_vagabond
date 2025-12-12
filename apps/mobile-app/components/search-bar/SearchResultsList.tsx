import { FlashList } from "@shopify/flash-list";
import React, { type ReactElement } from "react";
import { View } from "react-native";

import type { SearchResultType } from "@/http/search";
import type { RecentSearch } from "@/stores/recentSearchesAtom";

import { CustomText } from "../custom-ui/CustomText";
import { themeColors } from "../ui/gluestack-ui-provider/config";
import { Spinner } from "../ui/spinner";
import { SearchResultItem } from "./SearchResultItem";

interface BaseSearchResultsListProps {
  isLoading?: boolean;
  onBlurInput: () => void;
}

interface RecentSearchesListProps extends BaseSearchResultsListProps {
  resultType: "recentSearches";
  data: RecentSearch[] | undefined;
  onSelectRecentSearch: (search: RecentSearch) => void;
  onRemoveRecentSearch: (id: string) => Promise<void>;
}

interface SearchResultsListProps extends BaseSearchResultsListProps {
  resultType: "searchResults";
  data: SearchResultType[] | undefined;
  onSelectResult: (result: SearchResultType) => void;
}

type SearchResultsListPropsUnion =
  | RecentSearchesListProps
  | SearchResultsListProps;

/**
 * Generic list component for search results
 * Can be used for both recent searches and current search results
 */
export const SearchResultsList = (
  props: SearchResultsListPropsUnion,
): ReactElement | null => {
  const { resultType, data, isLoading = false, onBlurInput } = props;
  if (isLoading) {
    return (
      <View className="flex-1 bg-background-100">
        <View className="flex-row items-center justify-center py-4">
          <Spinner size="small" color={themeColors.secondary[500].hex} />
          <CustomText className="ml-3 text-secondary-500">
            Recherche en cours...
          </CustomText>
        </View>
      </View>
    );
  }

  if ((data === undefined || data.length === 0) && !isLoading) {
    return (
      <View className="flex-1 items-center bg-background-100">
        <CustomText className="py-4 text-center text-secondary-500">
          {"Aucun résultat trouvé"}
        </CustomText>
      </View>
    );
  }

  const renderItem = ({
    item,
  }: {
    item: RecentSearch | SearchResultType;
  }): ReactElement | null => {
    if (resultType === "recentSearches") {
      return (
        <SearchResultItem
          result={(item as RecentSearch).result}
          onPress={() => {
            props.onSelectRecentSearch(item as RecentSearch);
          }}
          onRemove={() => {
            void props.onRemoveRecentSearch((item as RecentSearch).result.id);
          }}
        />
      );
    } else {
      return (
        <SearchResultItem
          result={item as SearchResultType}
          onPress={() => {
            props.onSelectResult(item as SearchResultType);
          }}
        />
      );
    }
  };

  const keyExtractor = (item: SearchResultType | RecentSearch): string => {
    if (resultType === "recentSearches") {
      const recentSearch = item as RecentSearch;
      return `recent-${recentSearch.timestamp}`;
    }
    const searchResult = item as SearchResultType;
    return searchResult.id;
  };

  return (
    <View className="flex-1 bg-background-100">
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardDismissMode={"on-drag"}
        keyboardShouldPersistTaps={"handled"}
        onScrollBeginDrag={onBlurInput}
      />
    </View>
  );
};
