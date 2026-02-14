import { type BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { type RefObject, useCallback } from "react";
import { BackHandler } from "react-native";

export const useBottomSheetBack = (
  bottomSheetOpen: boolean,
  bottomSheetModalRef: RefObject<BottomSheetModal | null>,
  onClose?: () => void,
): void => {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = (): boolean => {
        if (bottomSheetOpen && bottomSheetModalRef.current !== null) {
          bottomSheetModalRef.current.close();
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
    }, [bottomSheetModalRef, bottomSheetOpen, onClose]),
  );
};
