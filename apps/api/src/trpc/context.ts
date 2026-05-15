import jwt from "jsonwebtoken";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

// this context is used in the trpc router and is available in all resolvers
export const createContext = async ({ req, res }: CreateFastifyContextOptions) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return { req, res, userId: null, orgId: null };
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return {
      req,
      res,
      userId: (payload.userId as string) ?? null,
      orgId: (payload.orgId as string) ?? null,
    };
  } catch {
    return { req, res, userId: null, orgId: null };
  }
};

export type Context = Awaited<ReturnType<typeof createContext>>;
