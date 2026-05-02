import { useIsFocused } from "@react-navigation/native";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";

import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { useUserVisitedPois } from "@/hooks/queries/useUserVisitedPois";
import { trackEvent } from "@/lib/analytics/analytics";
import { useAppReviewVisitedPoiCountAtDismissal } from "@/stores/appReviewVisitedPoiCountAtDismissalAtom";
import { shouldShowAppReviewAtom } from "@/stores/shouldShowAppReviewAtom";

interface UseAppReviewModalReturn {
  isVisible: boolean;
  onClose: () => void;
  onDismiss: () => void;
}

const MIN_VISITED_POIS_FOR_REVIEW = 10;
const POIS_BETWEEN_RE_PROMPTS = 10;

export function useAppReviewModal(): UseAppReviewModalReturn {
  const isFocused = useIsFocused();
  const [shouldShowAppReview, setShouldShowAppReview] = useAtom(
    shouldShowAppReviewAtom,
  );
  const {
    visitedPoiCountAtDismissal,
    isHydrated,
    setVisitedPoiCountAtDismissal,
  } = useAppReviewVisitedPoiCountAtDismissal();
  const [isVisible, setIsVisible] = useState(false);
  const { data: currentUser } = useUsersMe();
  const {
    data: { visitedPois },
  } = useUserVisitedPois();

  useEffect(() => {
    if (
      !shouldShowAppReview ||
      !isFocused ||
      currentUser === undefined ||
      visitedPois === undefined ||
      !isHydrated
    ) {
      return;
    }

    const threshold =
      visitedPoiCountAtDismissal === undefined
        ? MIN_VISITED_POIS_FOR_REVIEW
        : visitedPoiCountAtDismissal + POIS_BETWEEN_RE_PROMPTS;

    if (!currentUser.hasAppReview && visitedPois.length >= threshold) {
      setIsVisible(true);
    }

    setShouldShowAppReview(false);
  }, [
    shouldShowAppReview,
    isFocused,
    currentUser,
    visitedPois,
    isHydrated,
    visitedPoiCountAtDismissal,
    setShouldShowAppReview,
  ]);

  const onClose = (): void => {
    setIsVisible(false);
  };

  const onDismiss = (): void => {
    if (visitedPois !== undefined) {
      void trackEvent("app_review_dismissed", {
        visited_poi_count: visitedPois.length,
        is_re_prompt: visitedPoiCountAtDismissal !== undefined,
      });
      void setVisitedPoiCountAtDismissal(visitedPois.length);
    }
    setIsVisible(false);
  };

  return { isVisible, onClose, onDismiss };
}
