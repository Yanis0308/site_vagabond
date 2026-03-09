import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { useDeleteVisitedPoi } from "./useDeleteVisitedPoi";

export const useDeleteVisitedPoiWithConfirm = (
  poiId: string,
): ((visitedPoiId: number) => void) => {
  const { t } = useTranslation("common");
  const { mutate: deleteVisitedPoi } = useDeleteVisitedPoi(poiId);

  return useCallback(
    (visitedPoiId: number): void => {
      Alert.alert(
        t("delete_review_confirm_title"),
        t("delete_review_confirm_message"),
        [
          { text: t("delete_review_confirm_no"), style: "cancel" },
          {
            text: t("delete_review_confirm_yes"),
            style: "destructive",
            onPress: (): void => {
              deleteVisitedPoi(visitedPoiId);
            },
          },
        ],
      );
    },
    [t, deleteVisitedPoi],
  );
};
