import { focusManager } from "@tanstack/react-query";
import { useNavigationContainerRef } from "expo-router";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";

import { queryClient } from "@/constants/QueryClient";

export function useReactQueryFocusManager(): void {
  const navigationRef = useNavigationContainerRef();

  // Handle app state changes (background → foreground)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (status) => {
      if (Platform.OS !== "web") {
        focusManager.setFocused(status === "active");
      }
    });
    return (): void => {
      sub.remove();
    };
  }, []);

  // Handle screen focus (tab switches, navigation changes)
  useEffect(() => {
    const unsubscribe = navigationRef.addListener("state", () => {
      void queryClient.refetchQueries({ type: "active" });
    });
    return unsubscribe;
  }, [navigationRef]);
}
