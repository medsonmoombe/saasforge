import { initTRPC } from "@trpc/server";
import { Context } from "./context";
import { projectRouter } from "./project-router";
import { taskRouter } from "./task-router";
import { publicRouter } from "./public-router";
import { notificationRouter } from "./notification-router";

const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  projects: projectRouter,
  tasks: taskRouter,
  public: publicRouter,
  notifications: notificationRouter,
});

export type AppRouter = typeof appRouter;
