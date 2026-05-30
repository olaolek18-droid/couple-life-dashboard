import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, couples, expenses, monthlyIncomes, dailyTasks, recipes, shoppingListItems, receipts, calendarEvents, workSchedules, notifications } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getOrCreateCouple(user1Id: number, user2Id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if couple already exists
  const existing = await db.select().from(couples).where(
    eq(couples.user1Id, user1Id)
  ).limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new couple
  await db.insert(couples).values({
    user1Id,
    user2Id,
  });

  // Fetch the newly created couple
  const created = await db.select().from(couples).where(
    eq(couples.user1Id, user1Id)
  ).limit(1);

  return created[0] || null;
}

export async function getCoupleByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(couples).where(
    eq(couples.user1Id, userId)
  ).limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getMonthlyExpenses(coupleId: number, month: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const result = await db.select().from(expenses).where(
    and(
      eq(expenses.coupleId, coupleId),
      // Add date range filter if needed
    )
  );

  return result;
}

export async function getTotalSavings(coupleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const couple = await db.select().from(couples).where(eq(couples.id, coupleId)).limit(1);
  return couple.length > 0 ? couple[0].currentSavings : 0;
}

export async function updateCoupleHappiness(coupleId: number, level: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(couples).set({ happinessLevel: level }).where(eq(couples.id, coupleId));
}

export async function getShoppingList(coupleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(shoppingListItems).where(eq(shoppingListItems.coupleId, coupleId));
}

export async function getDailyTasks(coupleId: number, date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(dailyTasks).where(eq(dailyTasks.coupleId, coupleId));
}

export async function getRecipes(coupleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(recipes).where(eq(recipes.coupleId, coupleId));
}

export async function getCalendarEvents(coupleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(calendarEvents).where(eq(calendarEvents.coupleId, coupleId));
}

export async function getReceipts(coupleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(receipts).where(eq(receipts.coupleId, coupleId));
}

export async function getWorkSchedules(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(workSchedules).where(eq(workSchedules.userId, userId));
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(notifications).where(eq(notifications.userId, userId));
}
