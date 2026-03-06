import { ArrowLeft, Search, X } from "lucide-react-native";
import React, {
  forwardRef,
  type ReactElement,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import {
  type LayoutChangeEvent,
  Pressable,
  type TextInput,
} from "react-native";

import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { View } from "@/components/ui/view";
import { useSearchTerm } from "@/stores/searchTermAtom";
import { shadowStyles } from "@/styles/shadows";
import { cn } from "@/utils/cn";

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

    useImperativeHandle(ref, () => ({
      blur: (): void => {
        inputRef.current?.blur();
      },
      focus: (): void => {
        inputRef.current?.focus();
      },
    }));

    const handleClear = (): void => {
      setSearchTerm("");
      onPress?.();
    };

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
        // Small delay to ensure input is ready
        setTimeout(() => {
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
        <Input
          variant="rounded"
          size="lg"
          className={cn(
            "flex-1 border border-burntOrange-700 bg-background-50",
          )}
          style={[shadowStyles.onMapComponent]}
          isReadOnly={!editable}
          onPress={() => {
            if (!editable) {
              onPress?.();
            }
          }}
        >
          {/* Left slot for search icon or back arrow */}
          {editable ? (
            <Pressable
              onPress={handleBackPress}
              className="pl-3"
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={hitSlop}
            >
              <InputIcon as={ArrowLeft} />
            </Pressable>
          ) : (
            <InputSlot className="pl-3" pointerEvents="auto">
              <InputIcon as={Search} />
            </InputSlot>
          )}

          <InputField
            // @ts-expect-error - InputField forwardRef type inference issue with TextInput ref
            ref={inputRef}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder={placeholder}
            placeholderTextColor={themeColors.typography[400].hex}
            accessibilityLabel="Champ de recherche"
            accessibilityHint={
              editable
                ? "Entrez un nom de lieu pour rechercher"
                : "Appuyez pour rechercher un lieu"
            }
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
            editable={editable}
            pointerEvents={editable ? "auto" : "none"}
            onSubmitEditing={onSubmitEditing}
            onPress={() => {
              if (!editable) {
                onPress?.();
              }
            }}
            onLayout={handleInputLayout}
          />

          {/* Right slot for clear button */}
          {searchTerm.length > 0 && (
            <InputSlot
              className="pr-3"
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
              hitSlop={hitSlop}
              pointerEvents="auto"
            >
              <InputIcon as={X} />
            </InputSlot>
          )}
        </Input>
      </View>
    );
  },
);

SearchHeader.displayName = "SearchHeader";
