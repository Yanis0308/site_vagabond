"use client";

import { type ChangeEvent, type ReactNode, use, useState } from "react";

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
  type DashboardUsersFilters,
  useDashboardUsers,
} from "@/lib/hooks/use-dashboard-users";

export default function UsersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): ReactNode {
  const { orgSlug } = use(params);
  const [filters, setFilters] = useState<DashboardUsersFilters>({
    search: "",
  });

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDashboardUsers(orgSlug, filters);

  const rows = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mobile Users</h1>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Rechercher (nom / email / nickname)..."
          value={filters.search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setFilters({ search: e.target.value });
          }}
          className="max-w-xs"
        />
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
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Visites</TableHead>
              <TableHead>Inscription</TableHead>
              <TableHead>Dernière visite</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Aucun user
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.displayName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.email ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.visitedPoisCount.toLocaleString("fr-FR")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(row.createdAt).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.lastVisitedPoiAt !== null
                    ? new Date(row.lastVisitedPoiAt).toLocaleDateString("fr-FR")
                    : "—"}
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
