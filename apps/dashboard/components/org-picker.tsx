"use client";

import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type DashboardOrg } from "@vagabond/shared-utils";
import { useSetAtom } from "jotai";
import { useParams, useRouter } from "next/navigation";
import { type ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { lastOrgSlugAtom } from "@/lib/atoms/last-org-slug";
import { useDashboardMe } from "@/lib/hooks/use-dashboard-me";

// `<OrgPicker />` — dropdown de switch d'org dans la sidebar (cf. ADR 0009).
// Visible **ssi** l'user a au moins un membership dans une organisation
// `business_type='staff'` : un client B2B n'a qu'1 org et n'a pas besoin de
// switcher.
export function OrgPicker(): ReactNode {
  const router = useRouter();
  const params = useParams<{ orgSlug?: string }>();
  const setLastOrgSlug = useSetAtom(lastOrgSlugAtom);
  const { data } = useDashboardMe();

  if (data === undefined) {
    return null;
  }

  const organizations = data.organizations;
  const isStaff = organizations.some((o) => o.businessType === "staff");
  if (!isStaff) {
    return null;
  }

  const currentSlug = params.orgSlug;
  const current = organizations.find((o) => o.slug === currentSlug);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="
          flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm
          hover:bg-sidebar-accent
        "
        aria-label="Changer d'organisation"
      >
        <span className="truncate">
          {current?.name ?? "Choisir une organisation"}
        </span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {organizations.map((org: DashboardOrg) => {
          const isCurrent = org.slug === currentSlug;
          return (
            <DropdownMenuItem
              key={org.id}
              onClick={() => {
                setLastOrgSlug(org.slug);
                router.push(`/orgs/${org.slug}`);
              }}
            >
              <span className="flex-1 truncate">{org.name}</span>
              {isCurrent && <HugeiconsIcon icon={Tick02Icon} size={14} />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
