import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";
import { projectRouter } from "./project-router";
import { taskRouter } from "./task-router";
import { publicRouter } from "./public-router";
import { notificationRouter } from "./notification-router";
import { authRouter } from "./auth-router";
import { ZodError } from "zod";

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    const isTRPCError = error instanceof TRPCError;
    const isZodError = error.cause instanceof ZodError;

    // Always strip stack traces from the response
    const safeData = { ...shape.data, stack: undefined };

    if (isZodError) {
      return {
        ...shape,
        data: safeData,
        message: error.cause.issues.map((i) => i.message).join(", "),
      };
    }

    if (isTRPCError && shape.data.httpStatus < 500) {
      return { ...shape, data: safeData };
    }

    return {
      ...shape,
      data: safeData,
      message: "Something went wrong. Please try again.",
    };
  },
});

export const appRouter = t.router({
  auth: authRouter,
  projects: projectRouter,
  tasks: taskRouter,
  public: publicRouter,
  notifications: notificationRouter,
});

export type AppRouter = typeof appRouter;
