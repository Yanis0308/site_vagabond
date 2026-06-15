import { Search, X } from "lucide-react-native";
import React, { forwardRef, type ReactElement, type ReactNode } from "react";
import { type TextInput, type TextInputProps } from "react-native";

import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { shadowStyles } from "@/styles/shadows";
import { cn } from "@/utils/cn";

interface SearchInputProps extends Omit<
  TextInputProps,
  "value" | "onChangeText" | "placeholder" | "editable"
> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  editable?: boolean;
  /** Override the left slot. Defaults to the search icon. */
  leftSlot?: ReactNode;
  /** Extra behaviour to run after the value has been cleared. */
  onClear?: () => void;
  /** Called when the input is pressed while read-only (not editable). */
  onPress?: () => void;
  /** Override the styling of the rounded input container. */
  containerClassName?: string;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

export const SearchInput = forwardRef<TextInput, SearchInputProps>(
  (
    {
      value,
      onChangeText,
      placeholder,
      editable = true,
      leftSlot,
      onClear,
      onPress,
      containerClassName,
      ...inputFieldProps
    },
    ref,
  ): ReactElement => {
    const handleClear = (): void => {
      onChangeText("");
      onClear?.();
    };

    return (
      <Input
        variant="rounded"
        size="lg"
        className={cn(
          "flex-1 border border-burntOrange-700 bg-background-50",
          containerClassName,
        )}
        style={[shadowStyles.onMapComponent]}
        isReadOnly={!editable}
        onPress={editable ? undefined : onPress}
      >
        {/* Left slot: search icon by default, overridable (e.g. back arrow) */}
        {leftSlot ?? (
          <InputSlot className="pl-3" pointerEvents="auto">
            <InputIcon as={Search} />
          </InputSlot>
        )}

        <InputField
          // @ts-expect-error - InputField forwardRef type inference issue with TextInput ref
          ref={ref}
          placeholderTextColor={themeColors.typography[400].hex}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
          {...inputFieldProps}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          editable={editable}
          pointerEvents={editable ? "auto" : "none"}
          onPress={editable ? undefined : onPress}
        />

        {/* Right slot: clear button, shown only when there is a value */}
        {value.length > 0 && (
          <InputSlot
            className="pr-3"
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
            hitSlop={HIT_SLOP}
            pointerEvents="auto"
          >
            <InputIcon as={X} />
          </InputSlot>
        )}
      </Input>
    );
  },
);

SearchInput.displayName = "SearchInput";
