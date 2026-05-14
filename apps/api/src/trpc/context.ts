import { createClerkClient, verifyToken } from "@clerk/backend";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { db } from "../db/connection";
import { organizations } from "../db/schema";
import { eq } from "drizzle-orm";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export const createContext = async ({req, res}: CreateFastifyContextOptions) => {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return { req, res, userId: null, orgId: null };
    }

    const token = authHeader.split(" ")[1];
    try {
        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY!,
        }) as any;
        
        // Extract Clerk org_id and user_id from the nested 'o' object
        const clerkOrgId = payload.o?.id ?? payload.org_id ?? null;
        const userId = payload.sub ?? null; // 'sub' is standard JWT claim for User ID
        
        if (!clerkOrgId) {
            return { req, res, userId, orgId: null };
        }
        
        // Look up the internal UUID from the Clerk org ID
        const org = await db.select({ id: organizations.id })
            .from(organizations)
            .where(eq(organizations.clerkOrgId, clerkOrgId))
            .limit(1);
        
        const orgId = org[0]?.id ?? null;
        
        return { req, res, userId, orgId };
    } catch (error) {
        console.error("Auth Error:", error);
        return { req, res, userId: null, orgId: null };
    }
}
export type Context = Awaited<ReturnType<typeof createContext>>;