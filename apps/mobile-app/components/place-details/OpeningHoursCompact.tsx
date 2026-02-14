import { memo, type ReactNode, useState } from "react";
import { Pressable } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { type PoiEnrichedType } from "@/http/pois";
import { cn } from "@/utils/cn";

interface OpeningHoursCompactProps {
  openingHours?: PoiEnrichedType["openingHours"];
  className?: string;
}

const DAY_SHORT_LABELS: Record<string, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mer",
  thursday: "Jeu",
  friday: "Ven",
  saturday: "Sam",
  sunday: "Dim",
};

const getCurrentDayIndex = (): number => {
  const today = new Date().getDay();
  // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  return today === 0 ? 6 : today - 1;
};

const getDayKey = (index: number): string => {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  return days[index] ?? "monday";
};

const formatTime = (time: string): string => {
  // Format HH:MM to HHhMM
  return time.replace(":", "h");
};

export const OpeningHoursCompact = memo(
  ({ openingHours, className }: OpeningHoursCompactProps): ReactNode => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (openingHours === undefined || openingHours.length === 0) {
      return null;
    }

    // Find today's hours
    const todayIndex = getCurrentDayIndex();
    const todayKey = getDayKey(todayIndex);
    const todayHours = openingHours.find((day) => day.day === todayKey);

    const isClosedToday =
      todayHours === undefined || todayHours.timeSlots.length === 0;

    // Get next open time if closed
    let nextOpenText = "";
    if (isClosedToday) {
      // Find next open day
      for (let i = 1; i <= 7; i++) {
        const nextIndex = (todayIndex + i) % 7;
        const nextKey = getDayKey(nextIndex);
        const nextDay = openingHours.find((day) => day.day === nextKey);
        if (
          nextDay !== undefined &&
          nextDay.timeSlots.length > 0 &&
          nextDay.timeSlots[0]?.open !== undefined
        ) {
          const dayLabel =
            i === 1 ? "demain" : (DAY_SHORT_LABELS[nextKey] ?? nextKey);
          nextOpenText = `Ouvre ${dayLabel} à ${formatTime(nextDay.timeSlots[0].open)}`;
          break;
        }
      }
    } else {
      // Get closing time for today
      const lastSlot = todayHours.timeSlots[todayHours.timeSlots.length - 1];
      if (lastSlot?.close !== undefined) {
        nextOpenText = `Ferme à ${formatTime(lastSlot.close)}`;
      }
    }

    const statusText = isClosedToday ? "Fermé" : "Ouvert";
    const summaryText = `${statusText} • ${nextOpenText}`;

    return (
      <Box className={cn("gap-2", className)}>
        <Pressable
          onPress={() => {
            setIsExpanded(!isExpanded);
          }}
          className="flex-row items-center justify-between py-1"
        >
          <Box className="flex-1 flex-row items-center gap-2">
            <CustomText type="ratingText" className="text-lg">
              {"🕐"}
            </CustomText>
            <CustomText type="ratingText" className="flex-1">
              {summaryText}
            </CustomText>
          </Box>
          <CustomText type="ratingText" className="ml-2 text-primary-500">
            {isExpanded ? "▲" : "▼"}
          </CustomText>
        </Pressable>
        {isExpanded && (
          <Box className="gap-1 pl-6">
            {openingHours.map((day) => {
              const dayLabel = DAY_SHORT_LABELS[day.day] ?? day.day;
              const isClosed = day.timeSlots.length === 0;
              // prettier-ignore
              const timeSlotsText = isClosed
                ? "Fermé"
                : day.timeSlots
                    .map(
                      (slot) =>
                        `${formatTime(slot.open)} - ${formatTime(slot.close)}`,
                    )
                    .join(", ");

              return (
                <Box key={day.day} className="flex-row justify-between py-1">
                  <CustomText type="ratingText" className="w-12 font-semibold">
                    {dayLabel}
                  </CustomText>
                  <CustomText type="ratingText" className="flex-1">
                    {timeSlotsText}
                  </CustomText>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    );
  },
);

OpeningHoursCompact.displayName = "OpeningHoursCompact";
