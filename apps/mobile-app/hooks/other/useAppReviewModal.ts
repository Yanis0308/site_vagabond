import { useIsFocused } from "@react-navigation/native";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";

import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { useUserVisitedPois } from "@/hooks/queries/useUserVisitedPois";
import { shouldShowAppReviewAtom } from "@/stores/shouldShowAppReviewAtom";

interface UseAppReviewModalReturn {
  isVisible: boolean;
  onClose: () => void;
}

const MIN_VISITED_POIS_FOR_REVIEW = 10;

export function useAppReviewModal(): UseAppReviewModalReturn {
  const isFocused = useIsFocused();
  const [shouldShowAppReview, setShouldShowAppReview] = useAtom(
    shouldShowAppReviewAtom,
  );
  const [isVisible, setIsVisible] = useState(false);
  const { data: currentUser } = useUsersMe();
  const {
    data: { visitedPois },
  } = useUserVisitedPois();

  useEffect(() => {
    if (!shouldShowAppReview) {
      return;
    }
    if (!isFocused) {
      return;
    }
    if (currentUser === undefined || visitedPois === undefined) {
      return;
    }
    if (
      !currentUser.hasAppReview &&
      visitedPois.length >= MIN_VISITED_POIS_FOR_REVIEW
    ) {
      setIsVisible(true);
    }
    setShouldShowAppReview(false);
  }, [
    shouldShowAppReview,
    isFocused,
    currentUser,
    visitedPois,
    setShouldShowAppReview,
  ]);

  const onClose = (): void => {
    setIsVisible(false);
  };

  return { isVisible, onClose };
}
