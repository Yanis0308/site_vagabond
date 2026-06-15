import { ArrowLeft } from "lucide-react-native";
import React, {
  forwardRef,
  type ReactElement,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import {
  type LayoutChangeEvent,
  Pressable,
  type TextInput,
} from "react-native";

import { SearchInput } from "@/components/custom-ui/SearchInput";
import { InputIcon } from "@/components/ui/input";
import { View } from "@/components/ui/view";
import { useSearchTerm } from "@/stores/searchTermAtom";

interface SearchHeaderProps {
  onBack?: () => void;
  placeholder: string;
  onLayout?: (height: number) => void;
  editable: boolean;
  onPress?: () => void;
  onSubmitEditing?: () => void;
}

export interface SearchHeaderRef {
  blur: () => void;
  focus: () => void;
}

export const SearchHeader = forwardRef<SearchHeaderRef, SearchHeaderProps>(
  (
    { onBack, placeholder, onLayout, editable, onPress, onSubmitEditing },
    ref,
  ): ReactElement => {
    const inputRef = useRef<TextInput>(null);
    const { searchTerm, setSearchTerm } = useSearchTerm();
    const hasFocusedRef = useRef(false);
    const inputLayoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    useEffect(() => {
      return (): void => {
        if (inputLayoutTimeoutRef.current !== null) {
          clearTimeout(inputLayoutTimeoutRef.current);
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      blur: (): void => {
        inputRef.current?.blur();
      },
      focus: (): void => {
        inputRef.current?.focus();
      },
    }));

    const handleBackPress = (): void => {
      inputRef.current?.blur();
      // Small delay to ensure blur is processed before onBack
      setTimeout(() => {
        onBack?.();
      }, 0);
    };

    const handleLayoutChange = (event: LayoutChangeEvent): void => {
      const { height } = event.nativeEvent.layout;
      onLayout?.(height);
    };

    // Force focus when editable becomes true, after screen is mounted
    useLayoutEffect(() => {
      if (editable && !hasFocusedRef.current) {
        // Use setTimeout to ensure the input is fully mounted and rendered
        const timer = setTimeout(() => {
          const current = inputRef.current;
          if (current !== null) {
            current.focus();
            hasFocusedRef.current = true;
          }
        }, 0);
        return (): void => {
          clearTimeout(timer);
        };
      }
      if (!editable) {
        hasFocusedRef.current = false;
      }
    }, [editable]);

    // Also try to focus when InputField layout is complete
    const handleInputLayout = (): void => {
      const current = inputRef.current;
      if (editable && !hasFocusedRef.current && current !== null) {
        if (inputLayoutTimeoutRef.current !== null) {
          clearTimeout(inputLayoutTimeoutRef.current);
        }
        // Small delay to ensure input is ready
        inputLayoutTimeoutRef.current = setTimeout(() => {
          inputLayoutTimeoutRef.current = null;
          const currentInput = inputRef.current;
          if (currentInput !== null) {
            currentInput.focus();
            hasFocusedRef.current = true;
          }
        }, 50);
      }
    };

    const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

    return (
      <View className="flex-row px-4" onLayout={handleLayoutChange}>
        <SearchInput
          ref={inputRef}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder={placeholder}
          editable={editable}
          onPress={onPress}
          onClear={onPress}
          onSubmitEditing={onSubmitEditing}
          onLayout={handleInputLayout}
          accessibilityLabel="Champ de recherche"
          accessibilityHint={
            editable
              ? "Entrez un nom de lieu pour rechercher"
              : "Appuyez pour rechercher un lieu"
          }
          leftSlot={
            editable ? (
              <Pressable
                onPress={handleBackPress}
                className="pl-3"
                accessibilityRole="button"
                accessibilityLabel="Retour"
                hitSlop={hitSlop}
              >
                <InputIcon as={ArrowLeft} />
              </Pressable>
            ) : undefined
          }
        />
      </View>
    );
  },
);

SearchHeader.displayName = "SearchHeader";
