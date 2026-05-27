"use client";

import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { orgHasFeature } from "@vagabond/shared-utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { DASHBOARD_PAGES } from "@/app/(dashboard)/_lib/dashboard-pages";
import { OrgPicker } from "@/components/org-picker";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useDashboardMe } from "@/lib/hooks/use-dashboard-me";

// Sidebar dérivée de `DASHBOARD_PAGES` (source unique côté front). Le filtre
// par feature applique le bypass staff (`orgHasFeature`) — une org
// `businessType='staff'` voit toutes les entrées.
export function AppSidebar({
  userEmail,
}: {
  userEmail: string | null;
}): ReactNode {
  const pathname = usePathname();
  const params = useParams<{ orgSlug?: string }>();
  const orgSlug = params.orgSlug;
  const { data: me } = useDashboardMe();
  const currentOrg = me?.organizations.find((o) => o.slug === orgSlug);

  const visiblePages =
    currentOrg !== undefined
      ? DASHBOARD_PAGES.filter((p) => orgHasFeature(currentOrg, p.feature))
      : [];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-2 text-sm font-semibold">
          Vagagond Dashboard
        </div>
        <OrgPicker />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visiblePages.map((page) => {
                const href =
                  orgSlug !== undefined
                    ? `/orgs/${orgSlug}${page.orgPath}`
                    : "#";
                return (
                  <SidebarMenuItem key={page.feature}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={pathname === href}
                    >
                      <HugeiconsIcon icon={page.icon} size={18} />
                      <span>{page.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="text-muted-foreground truncate px-2 py-1 text-xs">
          {userEmail ?? "Anonyme"}
        </div>
        <form action="/auth/sign-out" method="POST">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            <HugeiconsIcon icon={Logout01Icon} size={18} />
            <span>Déconnexion</span>
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
