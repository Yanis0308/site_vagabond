import type BottomSheet from "@gorhom/bottom-sheet";
import { type BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "expo-router";
import { type RefObject, useCallback } from "react";
import { BackHandler } from "react-native";

export const useBottomSheetBack = (
  bottomSheetOpen: boolean,
  bottomSheetRef: RefObject<BottomSheet | BottomSheetModal | null>,
  onClose?: () => void,
): void => {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = (): boolean => {
        if (bottomSheetOpen && bottomSheetRef.current !== null) {
          bottomSheetRef.current.close();
          onClose?.();
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return (): void => {
        subscription.remove();
      };
    }, [bottomSheetRef, bottomSheetOpen, onClose]),
  );
};
