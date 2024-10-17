import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { Platform } from "react-native";

import { logger } from "@/utils/logger";

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

function useAsyncState<T>(initialValue: [boolean, T | null]): UseStateHook<T> {
  return useReducer(
    (
      state: [boolean, T | null],
      action: T | null = null,
    ): [boolean, T | null] => [false, action],
    initialValue,
  ) as UseStateHook<T>;
}

export async function setStorageItemAsync(
  key: string,
  value: string | null,
): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      logger("Local storage is unavailable:", e);
    }
  } else {
    if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }
}

export function useStorageState(
  key: string,
  defaultValue: string | null,
): UseStateHook<string> {
  // Public
  const [state, setState] = useAsyncState<string>(
    useMemo(() => [defaultValue === null, defaultValue], [defaultValue]),
  );

  // Get
  useEffect(() => {
    if (Platform.OS === "web") {
      try {
        if (typeof localStorage !== "undefined") {
          setState(localStorage.getItem(key));
        }
      } catch (e) {
        logger("Local storage is unavailable:", e);
      }
    } else {
      void SecureStore.getItemAsync(key).then((value) => {
        setState(value);
      });
    }
  }, [key, setState]);

  // Set
  const setValue = useCallback(
    (value: string | null) => {
      logger("=== useStorageState, setValue:", value);
      setState(value);
      void setStorageItemAsync(key, value);
    },
    [key, setState],
  );

  return useMemo(() => [state, setValue], [setValue, state]);
}
