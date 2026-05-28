"use client";

import { type ReactNode, use } from "react";

import { DateRangeFilter } from "@/components/date-range-filter";
import { StatsChart } from "@/components/stats-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";

interface CountersShape {
  pois: number;
  mobileUsers: number;
  visitedPois: number;
  userFeedbacks: number;
}

const COUNTER_LABELS: Array<{ key: keyof CountersShape; label: string }> = [
  { key: "pois", label: "POIs" },
  { key: "mobileUsers", label: "Mobile Users" },
  { key: "visitedPois", label: "Visites" },
  { key: "userFeedbacks", label: "Feedbacks" },
];

export default function OrgHomePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): ReactNode {
  const { orgSlug } = use(params);
  const { data, isLoading, error } = useDashboardStats(orgSlug);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Aperçu</h1>
        <DateRangeFilter />
      </div>

      {error !== null && (
        <p className="text-sm text-destructive">
          Erreur lors du chargement : {String(error)}
        </p>
      )}

      <div
        className="
          grid grid-cols-1 gap-4
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        {COUNTER_LABELS.map((counter) => (
          <Card key={counter.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {counter.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || data === undefined ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <p className="text-3xl font-semibold">
                  {data.counters[counter.key].toLocaleString("fr-FR")}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div
        className="
          grid grid-cols-1 gap-4
          lg:grid-cols-2
        "
      >
        <StatsChart
          title="Visites"
          data={data?.timeseries ?? []}
          series={[
            {
              dataKey: "visitedPois",
              label: "Visites",
              color: "var(--color-primary)",
            },
          ]}
        />
        <StatsChart
          title="Feedbacks"
          data={data?.timeseries ?? []}
          series={[
            {
              dataKey: "userFeedbacks",
              label: "Feedbacks",
              color: "var(--color-secondary)",
            },
          ]}
        />
        <StatsChart
          title="App Reviews"
          data={data?.timeseries ?? []}
          series={[
            {
              dataKey: "appReviewsPositive",
              label: "Positives",
              color: "var(--color-primary)",
            },
            {
              dataKey: "appReviewsNegative",
              label: "Négatives",
              color: "var(--color-destructive)",
            },
          ]}
        />
        <StatsChart
          title="Nouveaux Mobile Users"
          data={data?.timeseries ?? []}
          series={[
            {
              dataKey: "newMobileUsers",
              label: "Inscriptions",
              color: "var(--color-primary-600)",
            },
          ]}
        />
      </div>
    </div>
  );
}
