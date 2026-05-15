import { pgTable, uuid, varchar, text, timestamp, pgEnum, jsonb, uniqueIndex, index, boolean } from 'drizzle-orm/pg-core';

// ==========================================
// ENUMS
// ==========================================
export const roleEnum = pgEnum("role", ["owner", "admin", "member"]);
export const planEnum = pgEnum("plan", ["free", "pro"]);
export const projectStatusEnum = pgEnum("project_status", ["active", "archived"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress","blocked", "done"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "task_assigned", 
  "status_changed", 
  "overdue_warning", 
  "project_shared"
]);

// ==========================================
// USERS TABLE
// ==========================================
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// ORGANIZATIONS TABLE (Keeping the Stripe fields for later!)
// ==========================================
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), 
  name: text("name").notNull(),
  plan: planEnum("plan").default("free").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("org_slug_idx").on(table.slug),
]);

export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "restrict" }).notNull(),
  role: roleEnum("role").default("member").notNull(),
  invitedBy: uuid("invited_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("unique_user_org_idx").on(table.userId, table.orgId),
]);

// ==========================================
// PROJECTS TABLE
// ==========================================
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "restrict" }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull(), 
  name: text("name").notNull(),
  shareToken: varchar("share_token", { length: 100 }).unique(),
  status: projectStatusEnum("status").default("active").notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("unique_project_slug_org_idx").on(table.slug, table.orgId),
]);

// ==========================================
// TASKS TABLE (The new engine)
// ==========================================
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "restrict" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  status: taskStatusEnum("status").default("todo").notNull(),
  // Inside the tasks table definition:
  blockerReason: text("blocker_reason"), // Only filled if status is 'blocked'
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  
  assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
  creatorId: uuid("creator_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  
  dueDate: timestamp("due_date", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  // Index for fast querying: Give me all tasks for this org and project
  index("task_org_project_idx").on(table.orgId, table.projectId),
]);

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  // What happened (e.g., "status_changed", "assignee_changed")
  action: varchar("action", { length: 50 }).notNull(),
  // JSON payload to store what changed (e.g., { from: "todo", to: "in_progress" })
  payload: jsonb("payload").$type<Record<string, any>>().default({}),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("activity_task_idx").on(table.taskId),
]);

// ==========================================
// IDEMPOTENCY TABLE (For Stripe later)
// ==========================================
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("password_reset_token_idx").on(table.token),
]);

export const stripeEvents = pgTable("stripe_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: varchar("event_id", { length: 100 }).notNull().unique(),
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const inviteTokens = pgTable("invite_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: roleEnum("role").default("member").notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("invite_token_idx").on(table.token),
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  
  recipientId: uuid("recipient_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  
  type: notificationTypeEnum("type").notNull(),
  message: text("message").notNull(),
  
  // To link back to the specific task/project
  entityId: varchar("entity_id", { length: 100 }),
  
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("notification_recipient_idx").on(table.recipientId),
])