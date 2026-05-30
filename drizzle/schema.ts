import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Couple-specific fields
  age: int("age"),
  monthlyIncome: decimal("monthlyIncome", { precision: 10, scale: 2 }).default("0"),
  coupleId: int("coupleId"), // Links both users in a couple
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Couple table to link two users together
 */
export const couples = mysqlTable("couples", {
  id: int("id").autoincrement().primaryKey(),
  user1Id: int("user1Id").notNull(),
  user2Id: int("user2Id").notNull(),
  targetAmount: decimal("targetAmount", { precision: 12, scale: 2 }).default("150000"),
  targetLocation: varchar("targetLocation", { length: 255 }).default("Sant Feliu de Guíxols"),
  currentSavings: decimal("currentSavings", { precision: 12, scale: 2 }).default("0"),
  happinessLevel: int("happinessLevel").default(50), // 0-100 scale
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Couple = typeof couples.$inferSelect;
export type InsertCouple = typeof couples.$inferInsert;

/**
 * Monthly income tracking per user
 */
export const monthlyIncomes = mysqlTable("monthlyIncomes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: date("month").notNull(), // First day of the month
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonthlyIncome = typeof monthlyIncomes.$inferSelect;
export type InsertMonthlyIncome = typeof monthlyIncomes.$inferInsert;

/**
 * Expense tracking with categories
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(), // Who registered the expense
  category: varchar("category", { length: 50 }).notNull(), // food, transport, utilities, entertainment, etc.
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Shared calendar events
 */
export const calendarEvents = mysqlTable("calendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["savings_goal", "milestone", "couple_event", "task", "reminder"]).default("reminder"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  notifyBefore: int("notifyBefore"), // Minutes before event to notify
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Daily tasks with assignment
 */
export const dailyTasks = mysqlTable("dailyTasks", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignedTo: int("assignedTo"), // User ID or null for both
  dueDate: date("dueDate").notNull(),
  completed: boolean("completed").default(false),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyTask = typeof dailyTasks.$inferSelect;
export type InsertDailyTask = typeof dailyTasks.$inferInsert;

/**
 * Work schedules for each user
 */
export const workSchedules = mysqlTable("workSchedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("endTime", { length: 5 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkSchedule = typeof workSchedules.$inferSelect;
export type InsertWorkSchedule = typeof workSchedules.$inferInsert;

/**
 * Shared recipes
 */
export const recipes = mysqlTable("recipes", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  ingredients: json("ingredients"), // JSON array of ingredients
  instructions: text("instructions"),
  prepTime: int("prepTime"), // Minutes
  cookTime: int("cookTime"), // Minutes
  servings: int("servings"),
  isFavorite: boolean("isFavorite").default(false),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

/**
 * Shared shopping list items
 */
export const shoppingListItems = mysqlTable("shoppingListItems", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  item: varchar("item", { length: 255 }).notNull(),
  quantity: varchar("quantity", { length: 50 }),
  unit: varchar("unit", { length: 20 }), // kg, L, units, etc.
  completed: boolean("completed").default(false),
  category: varchar("category", { length: 50 }), // produce, dairy, meat, pantry, etc.
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type InsertShoppingListItem = typeof shoppingListItems.$inferInsert;

/**
 * Receipt photos for price comparison
 */
export const receipts = mysqlTable("receipts", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  store: varchar("store", { length: 255 }).notNull(),
  photoUrl: text("photoUrl").notNull(), // Storage URL
  photoKey: text("photoKey").notNull(), // Storage key
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }),
  date: date("date").notNull(),
  items: json("items"), // JSON array of items with prices
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = typeof receipts.$inferInsert;

/**
 * Notifications sent to users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  type: mysqlEnum("type", ["reminder", "achievement", "milestone", "alert", "info"]).default("info"),
  read: boolean("read").default(false),
  relatedEventId: int("relatedEventId"), // Link to calendar event if applicable
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
