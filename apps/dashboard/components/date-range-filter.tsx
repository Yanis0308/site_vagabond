"use client";

import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAtom } from "jotai";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type DashboardDateRange,
  dashboardDateRangeAtom,
} from "@/lib/atoms/dashboard-date-range";

const PRESETS = [
  { label: "7 jours", days: 7 },
  { label: "30 jours", days: 30 },
  { label: "90 jours", days: 90 },
] as const;

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildRange(days: number): DashboardDateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to };
}

export function DateRangeFilter(): ReactNode {
  const [range, setRange] = useAtom(dashboardDateRangeAtom);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <Button
          key={preset.days}
          variant="outline"
          size="sm"
          onClick={() => {
            setRange(buildRange(preset.days));
          }}
        >
          {preset.label}
        </Button>
      ))}
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm">
              <HugeiconsIcon icon={Calendar03Icon} size={16} />
              <span>
                {formatDate(range.from)} – {formatDate(range.to)}
              </span>
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={{ from: range.from, to: range.to }}
            onSelect={(selected) => {
              if (selected?.from !== undefined && selected.to !== undefined) {
                setRange({ from: selected.from, to: selected.to });
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
