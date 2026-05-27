"use client";

import { type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface StatsChartSeries {
  dataKey: string;
  label: string;
  color: string;
}

interface StatsChartProps {
  title: string;
  data: Array<Record<string, number | string>>;
  series: StatsChartSeries[];
}

export function StatsChart({
  title,
  data,
  series,
}: StatsChartProps): ReactNode {
  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [s.dataKey, { label: s.label, color: s.color }]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[200px] w-full">
          <AreaChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <YAxis tickLine={false} axisLine={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {series.map((s) => (
              <Area
                key={s.dataKey}
                dataKey={s.dataKey}
                type="monotone"
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
