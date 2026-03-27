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
      <Card className="hover:border-primary-400 h-full transition-all hover:shadow-lg">
        <CardContent className="flex flex-col gap-2 p-5">
          <div className="flex items-baseline gap-2">
            <span className="text-primary-500 font-display text-2xl font-bold">
              {numero}
            </span>
            <h3 className="font-display text-foreground text-base font-bold">
              {nom}
            </h3>
          </div>
          <p className="text-typography-600 text-sm">
            {nbPois.toLocaleString("fr-FR")} {placesLabel}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
