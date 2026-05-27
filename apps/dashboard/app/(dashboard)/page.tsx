"use client";

import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { lastOrgSlugAtom } from "@/lib/atoms/last-org-slug";
import { useDashboardMe } from "@/lib/hooks/use-dashboard-me";

// Home Dashboard (`/`) — pure redirection (cf. ADR 0009) :
//   - 0 org accessible → écran "contacte ton admin"
//   - 1 org           → redirect direct vers cette org
//   - >1 orgs         → redirect vers `lastOrgSlug` si valide, sinon vers
//                       la première org accessible.
// Aucune UI picker ici : le picker est un composant sidebar persistant
// (cf. `<OrgPicker />`).
export default function HomePage(): ReactNode {
  const router = useRouter();
  const lastOrgSlug = useAtomValue(lastOrgSlugAtom);
  const { data, isLoading } = useDashboardMe();

  useEffect(() => {
    if (data === undefined) {
      return;
    }
    const orgs = data.organizations;
    const firstOrg = orgs[0];
    if (firstOrg === undefined) {
      return;
    }
    const target =
      lastOrgSlug !== null && orgs.some((o) => o.slug === lastOrgSlug)
        ? lastOrgSlug
        : firstOrg.slug;
    router.replace(`/orgs/${target}`);
  }, [data, lastOrgSlug, router]);

  if (isLoading || data === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (data.organizations.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Aucun accès</h1>
        <p className="text-muted-foreground">
          Tu n&apos;as accès à aucune organisation. Contacte ton administrateur
          pour être ajouté à une organisation.
        </p>
      </div>
    );
  }

  return null;
}
