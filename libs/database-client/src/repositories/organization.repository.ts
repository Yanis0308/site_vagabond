import {
  type DashboardFeature,
  filterValidDashboardFeatures,
} from "@vagabond/shared-utils";
import { and, eq } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import {
  type BusinessType,
  dashboardMemberships,
  dashboardOrganizationBoundaries,
  dashboardOrganizations,
  type ScopeMode,
} from "../schema.js";

export type BoundaryScope =
  | { kind: "global" }
  | { kind: "boundaries"; boundaryIds: string[] };

export interface DashboardOrgContext {
  id: number;
  slug: string;
  name: string;
  businessType: BusinessType;
  scopeMode: ScopeMode;
  scope: BoundaryScope;
  features: DashboardFeature[];
}

export class OrganizationRepository {
  constructor(private readonly db: DrizzleClient) {}

  async listForUser(userId: string): Promise<DashboardOrgContext[]> {
    const rows = await this.db
      .select({
        id: dashboardOrganizations.id,
        slug: dashboardOrganizations.slug,
        name: dashboardOrganizations.name,
        businessType: dashboardOrganizations.businessType,
        scopeMode: dashboardOrganizations.scopeMode,
        features: dashboardOrganizations.features,
      })
      .from(dashboardOrganizations)
      .innerJoin(
        dashboardMemberships,
        eq(dashboardMemberships.organizationId, dashboardOrganizations.id),
      )
      .where(eq(dashboardMemberships.userId, userId))
      .orderBy(dashboardOrganizations.id);

    const contexts: DashboardOrgContext[] = [];
    for (const row of rows) {
      const scope = await this.loadScope(row.id, row.scopeMode);
      contexts.push({
        ...row,
        scope,
        features: filterValidDashboardFeatures(row.features),
      });
    }
    return contexts;
  }

  async loadContextForUser(params: {
    slug: string;
    userId: string;
  }): Promise<DashboardOrgContext | null> {
    const [row] = await this.db
      .select({
        id: dashboardOrganizations.id,
        slug: dashboardOrganizations.slug,
        name: dashboardOrganizations.name,
        businessType: dashboardOrganizations.businessType,
        scopeMode: dashboardOrganizations.scopeMode,
        features: dashboardOrganizations.features,
      })
      .from(dashboardOrganizations)
      .innerJoin(
        dashboardMemberships,
        and(
          eq(dashboardMemberships.organizationId, dashboardOrganizations.id),
          eq(dashboardMemberships.userId, params.userId),
        ),
      )
      .where(eq(dashboardOrganizations.slug, params.slug))
      .limit(1);

    if (row === undefined) {
      return null;
    }

    const scope = await this.loadScope(row.id, row.scopeMode);
    return {
      ...row,
      scope,
      features: filterValidDashboardFeatures(row.features),
    };
  }

  private async loadScope(
    organizationId: number,
    scopeMode: ScopeMode,
  ): Promise<BoundaryScope> {
    if (scopeMode === "ALL") {
      return { kind: "global" };
    }
    const rows = await this.db
      .select({ boundaryId: dashboardOrganizationBoundaries.boundaryId })
      .from(dashboardOrganizationBoundaries)
      .where(
        eq(dashboardOrganizationBoundaries.organizationId, organizationId),
      );
    return {
      kind: "boundaries",
      boundaryIds: rows.map((r) => r.boundaryId),
    };
  }
}
