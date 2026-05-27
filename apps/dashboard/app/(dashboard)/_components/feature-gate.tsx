"use client";

import { orgHasFeature } from "@vagabond/shared-utils";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { resolveRequiredFeature } from "@/app/(dashboard)/_lib/dashboard-pages";
import { useDashboardMe } from "@/lib/hooks/use-dashboard-me";

// Garde feature centralisée pour le Dashboard (cf. ADR 0009). Posée au niveau
// du layout root `(dashboard)/layout.tsx`, elle s'applique à toutes les pages.
// La règle d'inclusion est dans `_lib/dashboard-pages.ts` (source unique pour
// FeatureGate et sidebar — impossible de désynchroniser).
//
// Sécurité : ce composant ne fait QUE de l'UX (éviter d'afficher du contenu
// vide à l'user). La vraie sécurité est portée côté API par les preHandlers
// `requireFeature` — un user qui bypass cette garde tombera sur des 403.
export function FeatureGate({ children }: { children: ReactNode }): ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me, isLoading } = useDashboardMe();

  const requirement = resolveRequiredFeature(pathname);

  // allowed:
  //   - true        → render children
  //   - false       → redirect to /no-access (via effect)
  //   - null        → still loading, return null (no flash)
  const allowed = ((): boolean | null => {
    if (requirement === null) return true; // pages hors mapping (no-access, /)
    if (me === undefined) return null;
    const org = me.organizations.find((o) => o.slug === requirement.orgSlug);
    if (org === undefined) return false;
    return orgHasFeature(org, requirement.feature);
  })();

  useEffect(() => {
    if (!isLoading && allowed !== null && !allowed) {
      router.replace("/no-access");
    }
  }, [isLoading, allowed, router]);

  if (allowed === null || !allowed) return null;
  return <>{children}</>;
}
