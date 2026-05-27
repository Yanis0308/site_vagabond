import { eq } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { dashboardUsers } from "../schema.js";

export type DbDashboardUser = typeof dashboardUsers.$inferSelect;

export interface DashboardUserInfo {
  email: string;
  name?: string | null;
}

export class DashboardUserRepository {
  constructor(private readonly db: DrizzleClient) {}

  async upsertDashboardUser(
    id: string,
    info: DashboardUserInfo,
  ): Promise<{ user: DbDashboardUser; isNew: boolean }> {
    const existing = await this.db.query.dashboardUsers.findFirst({
      where: eq(dashboardUsers.id, id),
      columns: { id: true },
    });
    const isNew = existing === undefined;

    const [user] = await this.db
      .insert(dashboardUsers)
      .values({
        id,
        email: info.email,
        name: info.name ?? null,
        lastLogin: new Date(),
      })
      .onConflictDoUpdate({
        target: dashboardUsers.id,
        set: {
          email: info.email,
          ...(info.name !== undefined ? { name: info.name } : {}),
          updatedAt: new Date(),
          lastLogin: new Date(),
        },
      })
      .returning();

    if (user === undefined) {
      throw new Error("Failed to upsert dashboard user");
    }

    return { user, isNew };
  }

  async getDashboardUser(id: string): Promise<DbDashboardUser | null> {
    const found = await this.db.query.dashboardUsers.findFirst({
      where: eq(dashboardUsers.id, id),
    });
    return found ?? null;
  }
}
