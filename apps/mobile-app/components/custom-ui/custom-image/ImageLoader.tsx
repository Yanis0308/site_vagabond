import { type ReactElement } from "react";
import { View } from "react-native";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/utils/cn";

interface ImageLoaderProps {
  showLoader: boolean;
  isLoading: boolean;
  className?: string;
}

/**
 * Displays a loading spinner overlay for images
 */
export const ImageLoader = ({
  showLoader,
  isLoading,
  className,
}: ImageLoaderProps): ReactElement | null => {
  if (!showLoader) {
    return null;
  }

  const displayLoader = isLoading;

  return (
    <View
      className={cn(
        `absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out`,
        {
          "opacity-100": displayLoader,
          "pointer-events-none opacity-0": !displayLoader,
        },
        className,
      )}
    >
      <Spinner size="large" className="text-gray-600" />
    </View>
  );
};
