"use client";

import { type ChangeEvent, type ReactNode, use, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type DashboardAppReviewsFilters,
  useDashboardAppReviews,
} from "@/lib/hooks/use-dashboard-app-reviews";

const POSITIVE_OPTIONS: Array<{
  value: DashboardAppReviewsFilters["positive"];
  label: string;
}> = [
  { value: "all", label: "Toutes" },
  { value: "yes", label: "Positives" },
  { value: "no", label: "Négatives" },
];

export default function AppReviewsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): ReactNode {
  const { orgSlug } = use(params);
  const [filters, setFilters] = useState<DashboardAppReviewsFilters>({
    positive: "all",
  });

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDashboardAppReviews(orgSlug, filters);

  const rows = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">App Reviews</h1>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.positive}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            setFilters({
              positive: e.target
                .value as DashboardAppReviewsFilters["positive"],
            });
          }}
          className="rounded-md border border-input bg-input/20 px-2 py-1.5 text-sm"
        >
          {POSITIVE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error !== null && (
        <p className="text-sm text-destructive">
          Erreur de chargement : {String(error)}
        </p>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Avis</TableHead>
              <TableHead>Commentaire</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  Aucune review
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString("fr-FR")}
                </TableCell>
                <TableCell>{row.userDisplayName}</TableCell>
                <TableCell>
                  {row.positive ? (
                    <Badge variant="secondary">Positive</Badge>
                  ) : (
                    <Badge variant="destructive">Négative</Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-md">
                  {row.comment ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          disabled={!hasNextPage || isFetchingNextPage}
          onClick={() => {
            void fetchNextPage();
          }}
        >
          {isFetchingNextPage
            ? "Chargement..."
            : hasNextPage
              ? "Charger plus"
              : "Fin des résultats"}
        </Button>
      </div>
    </div>
  );
}
