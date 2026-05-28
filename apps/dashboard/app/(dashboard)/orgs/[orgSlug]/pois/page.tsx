"use client";

import { type PoiFilterLevelEnum } from "@vagabond/shared-utils";
import { type ChangeEvent, type ReactNode, use, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type DashboardPoisFilters,
  useDashboardPois,
} from "@/lib/hooks/use-dashboard-pois";

const FILTER_LEVEL_OPTIONS: Array<{
  value: PoiFilterLevelEnum | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "Tous niveaux" },
  { value: "UNKNOWN", label: "Unknown" },
  { value: "STRICT", label: "Strict" },
  { value: "STANDARD", label: "Standard" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "LAXIST", label: "Laxist" },
];

const DISABLED_OPTIONS: Array<{
  value: DashboardPoisFilters["disabled"];
  label: string;
}> = [
  { value: "all", label: "Tous" },
  { value: "no", label: "Actifs" },
  { value: "yes", label: "Désactivés" },
];

export default function PoisPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): ReactNode {
  const { orgSlug } = use(params);
  const [filters, setFilters] = useState<DashboardPoisFilters>({
    search: "",
    filterLevel: "ALL",
    disabled: "all",
  });

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDashboardPois(orgSlug, filters);

  const rows = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">POIs</h1>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Rechercher par nom..."
          value={filters.search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setFilters((prev) => ({ ...prev, search: e.target.value }));
          }}
          className="max-w-xs"
        />
        <select
          value={filters.filterLevel}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            setFilters((prev) => ({
              ...prev,
              filterLevel: e.target.value as PoiFilterLevelEnum | "ALL",
            }));
          }}
          className="rounded-md border border-input bg-input/20 px-2 py-1.5 text-sm"
        >
          {FILTER_LEVEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={filters.disabled}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            setFilters((prev) => ({
              ...prev,
              disabled: e.target.value as DashboardPoisFilters["disabled"],
            }));
          }}
          className="rounded-md border border-input bg-input/20 px-2 py-1.5 text-sm"
        >
          {DISABLED_OPTIONS.map((option) => (
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
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Aucun POI
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name ?? "—"}</TableCell>
                <TableCell>{row.mainCategory ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.filterLevel}</Badge>
                </TableCell>
                <TableCell>
                  {row.disabled ? (
                    <Badge variant="destructive">Désactivé</Badge>
                  ) : (
                    <Badge variant="secondary">Actif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(row.createdAt).toLocaleDateString("fr-FR")}
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
