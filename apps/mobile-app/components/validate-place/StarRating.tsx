import React, { useCallback } from "react";
import { Pressable, View } from "react-native";

import { cn } from "@/utils/cn";

import { StarIcon } from "../icons/StarIcon";

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = React.memo(
  ({ rating, onChange, className }) => {
    return (
      <View
        className={cn(
          "flex flex-row items-center gap-1 border-secondary-500 shadow-[0px_4px_4px_-2px] shadow-shadow-ratingBlock px-4 py-2 rounded-[34px] border-2 border-solid bg-brightYellow-100",
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
            />
          );
        })}
      </View>
    );
  },
);

StarRating.displayName = "StarRating";

interface StarItemProps {
  starValue: number;
  rating: number;
  onPress: (value: number) => void;
}

const StarItem: React.FC<StarItemProps> = React.memo(
  ({ starValue, rating, onPress }) => {
    const handlePress = useCallback(() => {
      onPress(starValue);
    }, [onPress, starValue]);

    const isActive = starValue <= rating;

    return (
      <Pressable onPress={handlePress}>
        <StarIcon checked={isActive} size={32} />
      </Pressable>
    );
  },
);

StarItem.displayName = "StarItem";
