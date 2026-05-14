import Fastify from "fastify";
import cors from "@fastify/cors";
import 'dotenv/config';
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";
import { db } from "./db/connection";
import { sql } from "drizzle-orm";

const app = Fastify({ logger: true }); 

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const envAllowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...defaultAllowedOrigins, ...envAllowedOrigins]);

app.register(cors, {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    if (origin.endsWith(".vercel.app")) {
      callback(null, true);
      return;
    }

    try {
      const url = new URL(origin);
      const isDevFrontendPort = url.port === "3000";
      const isLocalNetworkHost =
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        /^10\./.test(url.hostname) ||
        /^192\.168\./.test(url.hostname) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(url.hostname);

      callback(null, isDevFrontendPort && isLocalNetworkHost);
      return;
    } catch {
      callback(null, false);
      return;
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

app.register(fastifyTRPCPlugin, {
  prefix:'/trpc',
  useWSS: false,
  trpcOptions: { router: appRouter, createContext }
});

app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

app.addHook('preHandler', async (request, reply) => {
  if(request.url.startsWith("/trpc") && (request as any).orgId) {
    const orgId = (request as any).orgId;
  }
});

const start = async () => {
  try {
    await app.listen({ port: 4000, host: "0.0.0.0" });
    console.log("🚀 SaaSForge API running on http://localhost:4000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
