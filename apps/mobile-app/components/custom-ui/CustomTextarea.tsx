import { type ComponentRef, forwardRef, memo } from "react";

import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";

interface CustomTextareaProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isInvalid?: boolean;
}

export const CustomTextarea = memo(
  forwardRef<ComponentRef<typeof TextareaInput>, CustomTextareaProps>(
    ({ placeholder, value, onChange, isInvalid, ...props }, ref) => {
      return (
        <Textarea
          isInvalid={isInvalid}
          className={cn(
            "border border-background-300 rounded-2xl border-solid bg-background-50 flex justify-start",
            props.className,
          )}
        >
          <TextareaInput
            ref={ref}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            className="p-4"
            textAlignVertical="top"
          />
        </Textarea>
      );
    },
  ),
);

CustomTextarea.displayName = "CustomTextarea";
