"use client";

import { type ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { trackExplorerDepartementClick } from "@/lib/analytics";

interface Props {
  slug: string;
  nom: string;
  numero: string;
  nbPois: number;
  regionSlug: string;
  placesLabel?: string;
}

export function DepartementCard({
  slug,
  nom,
  numero,
  nbPois,
  regionSlug,
  placesLabel = "lieux",
}: Props): ReactNode {
  return (
    <Link
      href={`/explorer/${regionSlug}/${slug}`}
      onClick={(): void => {
        trackExplorerDepartementClick(regionSlug, slug);
      }}
    >
      <Card
        className="
          h-full transition-all
          hover:border-primary-400 hover:shadow-lg
        "
      >
        <CardContent className="flex flex-col gap-2 p-5">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-primary-500">
              {numero}
            </span>
            <h3 className="font-display text-base font-bold text-foreground">
              {nom}
            </h3>
          </div>
          <p className="text-sm text-typography-600">
            {nbPois.toLocaleString("fr-FR")} {placesLabel}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
