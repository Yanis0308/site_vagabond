import React, { useCallback } from "react";
import { Pressable, View } from "react-native";

import { cn } from "@/utils/cn";

import { CustomText } from "../custom-ui/CustomText";
import { StarIcon } from "../icons/StarIcon";

interface StarRatingProps {
  rating: number;
  withoutBackground?: boolean;
  onChange?: (rating: number) => void;
  ratingCount?: number;
  size?: number;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = React.memo(
  ({
    rating,
    onChange,
    className,
    size = 32,
    ratingCount,
    withoutBackground = false,
  }) => {
    return (
      <View
        className={cn(
          "flex flex-row items-center gap-1",
          !withoutBackground &&
            "bg-brightYellow-100 border-secondary-500 shadow-[0px_4px_4px_-2px] shadow-shadow-ratingBlock border-2 border-solid px-4 py-2 rounded-[34px]",
          className,
        )}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          return (
            <StarItem
              key={starValue}
              starValue={starValue}
              rating={rating}
              onPress={onChange}
              size={size}
            />
          );
        })}
        {ratingCount !== undefined && (
          <CustomText type="ratingText" className="pl-1 text-primary-700">
            {`${ratingCount} avis`}
          </CustomText>
        )}
      </View>
    );
  },
);

StarRating.displayName = "StarRating";

interface StarItemProps {
  starValue: number;
  rating: number;
  onPress?: (value: number) => void;
  size?: number;
}

const StarItem: React.FC<StarItemProps> = React.memo(
  ({ starValue, rating, onPress, size = 32 }) => {
    const handlePress = useCallback(() => {
      onPress?.(starValue);
    }, [onPress, starValue]);

    const isActive = starValue <= rating;

    return (
      <Pressable onPress={handlePress}>
        <StarIcon checked={isActive} size={size} />
      </Pressable>
    );
  },
);

StarItem.displayName = "StarItem";
