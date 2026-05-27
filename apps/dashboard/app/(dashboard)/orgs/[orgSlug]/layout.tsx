"use client";

import { useSetAtom } from "jotai";
import { type ReactNode, use, useEffect } from "react";

import { lastOrgSlugAtom } from "@/lib/atoms/last-org-slug";

// Layout des routes org-scopées. À chaque atterrissage sur `/orgs/[orgSlug]/...`,
// on persiste le slug dans `lastOrgSlugAtom` (localStorage) pour que la home
// `/` puisse rediriger vers la dernière org à la prochaine visite (cf. ADR 0009).
export default function OrgLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}): ReactNode {
  const { orgSlug } = use(params);
  const setLastOrgSlug = useSetAtom(lastOrgSlugAtom);

  useEffect(() => {
    setLastOrgSlug(orgSlug);
  }, [orgSlug, setLastOrgSlug]);

  return children;
}
