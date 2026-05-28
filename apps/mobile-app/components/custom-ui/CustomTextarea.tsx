import {
  type ComponentRef,
  forwardRef,
  memo,
  useImperativeHandle,
  useRef,
} from "react";

import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";

export interface CustomTextareaRef {
  focus: () => void;
}

interface CustomTextareaProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isInvalid?: boolean;
  autoFocus?: boolean;
}

export const CustomTextarea = memo(
  forwardRef<CustomTextareaRef, CustomTextareaProps>(
    ({ placeholder, value, onChange, isInvalid, autoFocus, ...props }, ref) => {
      const inputRef = useRef<ComponentRef<typeof TextareaInput>>(null);

      useImperativeHandle(ref, () => ({
        focus: (): void => {
          // gluestack types the ref as TextInputProps but at runtime it's a TextInput instance
          (inputRef.current as unknown as { focus?: () => void }).focus?.();
        },
      }));

      return (
        <Textarea
          isInvalid={isInvalid}
          className={cn(
            `flex justify-start rounded-2xl border border-solid border-background-300 bg-background-50`,
            props.className,
          )}
        >
          <TextareaInput
            ref={inputRef}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="p-4"
            textAlignVertical="top"
          />
        </Textarea>
      );
    },
  ),
);

CustomTextarea.displayName = "CustomTextarea";
