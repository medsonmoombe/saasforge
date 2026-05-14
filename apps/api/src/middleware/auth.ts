import { createClerkClient, verifyToken } from "@clerk/backend";
import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db";
import { sql } from "drizzle-orm";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
    const authHeader = req.headers['authorization'];
    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {

        const session = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY!,
        });

        const orgId = session.orgId;

        if(!orgId) {
            return reply.status(403).send({ error: 'Forbidden: No active organization selected' });
        }

        await db.execute(sql`BEGIN`);
        await db.execute(sql`SET LOCAL app.current_org_id = ${orgId}`);

        (req as any).auth = session;
        
    } catch (error) {
     console.error("Auth/RLS Error:", error);
    return reply.status(401).send({ error: "Unauthorized: Invalid token" });
    }
}