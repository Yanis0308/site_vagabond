"use client";

import { type UserFeedbackCategory } from "@vagabond/shared-utils";
import {
  type ChangeEvent,
  Fragment,
  type ReactNode,
  use,
  useState,
} from "react";

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
  type DashboardFeedbacksFilters,
  useDashboardFeedbacks,
} from "@/lib/hooks/use-dashboard-feedbacks";

const CATEGORY_OPTIONS: Array<{
  value: UserFeedbackCategory | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "Toutes catégories" },
  { value: "BUG", label: "Bug" },
  { value: "PLACE_SUGGESTION", label: "Place suggestion" },
  { value: "POI_REPORT", label: "POI report" },
  { value: "SUGGESTION", label: "Suggestion" },
  { value: "INCOMPREHENSION", label: "Incompréhension" },
  { value: "OTHER", label: "Autre" },
];

export default function FeedbacksPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): ReactNode {
  const { orgSlug } = use(params);
  const [filters, setFilters] = useState<DashboardFeedbacksFilters>({
    category: "ALL",
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDashboardFeedbacks(orgSlug, filters);

  const rows = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Feedbacks utilisateurs</h1>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.category}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            setFilters({
              category: e.target.value as UserFeedbackCategory | "ALL",
            });
          }}
          className="rounded-md border border-input bg-input/20 px-2 py-1.5 text-sm"
        >
          {CATEGORY_OPTIONS.map((option) => (
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
              <TableHead>Catégorie</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>POI</TableHead>
              <TableHead>App</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Aucun feedback
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => {
              const isExpanded = expandedId === row.id;
              return (
                <Fragment key={row.id}>
                  <TableRow
                    onClick={() => {
                      setExpandedId(isExpanded ? null : row.id);
                    }}
                    className="cursor-pointer"
                  >
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.category}</Badge>
                    </TableCell>
                    <TableCell>{row.userDisplayName}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {row.message}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.targetPoiId ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {row.os} {row.appVersion}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/30">
                        <pre className="overflow-x-auto text-xs">
                          {JSON.stringify(row.payload, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
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
