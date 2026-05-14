import { db } from "../db/connection";
import { projects, organizations } from "../db/schema";
import { sql, eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const PlanService = {
  async enforceProjectLimit(orgId: string) {
    // 1. Get the organization's plan
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Org not found" });

    // 2. Count how many active projects they have
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(and(eq(projects.orgId, orgId), sql`deleted_at is null`));

    const currentProjectCount = result.count;

    // 3. Enforce the rule
    const LIMITS = {
      free: 3,
      pro: Infinity, // Unlimited
    };

    const limit = LIMITS[org.plan];
    
    if (currentProjectCount >= limit) {
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: `You have reached the maximum number of projects (${limit}) for the ${org.plan} plan. Please upgrade.` 
      });
    }
  }
};
