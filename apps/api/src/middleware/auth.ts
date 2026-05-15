import jwt from "jsonwebtoken";
import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db";
import { sql } from "drizzle-orm";

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const orgId = payload.orgId;

    if (!orgId) {
      return reply.status(403).send({ error: "Forbidden: No active organization" });
    }

    await db.execute(sql`BEGIN`);
    await db.execute(sql`SET LOCAL app.current_org_id = ${orgId}`);

    (req as any).auth = payload;
  } catch {
    return reply.status(401).send({ error: "Unauthorized: Invalid token" });
  }
}
