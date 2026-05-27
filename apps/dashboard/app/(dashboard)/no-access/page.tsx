import Link from "next/link";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";

// Cible des redirects du FeatureGate (cf. _components/feature-gate.tsx) :
// affichée quand l'org courante n'a pas la feature requise ou quand l'org du
// path n'est pas accessible à l'user.
export default function NoAccessPage(): ReactNode {
  return (
    <div className="mx-auto max-w-md space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">Accès limité</h1>
      <p className="text-muted-foreground">
        Cette section n&apos;est pas activée pour votre organisation. Contactez
        l&apos;équipe Vagabond pour étendre votre offre.
      </p>
      <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
        Retour au tableau de bord
      </Button>
    </div>
  );
}
