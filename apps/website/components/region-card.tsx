import { type ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

interface Props {
  slug: string;
  nom: string;
  nbPois: number;
  nbDepartements?: number;
  placesLabel?: string;
}

export function RegionCard({
  slug,
  nom,
  nbPois,
  nbDepartements,
  placesLabel = "lieux",
}: Props): ReactNode {
  return (
    <Link href={`/explorer/${slug}`}>
      <Card className="hover:border-primary-400 h-full transition-all hover:shadow-lg">
        <CardContent className="flex flex-col gap-2 p-5">
          <h3 className="font-display text-foreground text-lg font-bold">
            {nom}
          </h3>
          <div className="text-typography-600 flex gap-4 text-sm">
            <span>
              {nbPois.toLocaleString("fr-FR")} {placesLabel}
            </span>
            {nbDepartements !== undefined ? (
              <span>{nbDepartements} dép.</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
