import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getDb, getOrCreateCouple, getCoupleByUserId, getMonthlyExpenses, getTotalSavings, updateCoupleHappiness, getShoppingList, getDailyTasks, getRecipes, getCalendarEvents, getReceipts, getWorkSchedules, getUserNotifications } from "./db";
import { z } from "zod";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Couple management
  couple: router({
    getOrCreate: protectedProcedure
      .input(z.object({ partnerId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // For now, create a couple with the current user as user1
        // In a real scenario, you'd handle partner linking differently
        const couple = await getOrCreateCouple(ctx.user.id, input.partnerId || ctx.user.id);
        return couple;
      }),

    get: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      return couple;
    }),

    updateHappiness: protectedProcedure
      .input(z.object({ level: z.number().min(0).max(100) }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new Error("Couple not found");
        
        await updateCoupleHappiness(couple.id, input.level);
        return { success: true };
      }),
  }),

  // Financial management
  finances: router({
    addExpense: protectedProcedure
      .input(z.object({
        category: z.string(),
        amount: z.number(),
        description: z.string().optional(),
        date: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new Error("Couple not found");

        // Insert expense
        await db.insert(schema.expenses).values({
          coupleId: couple.id,
          userId: ctx.user.id,
          category: input.category,
          amount: input.amount.toString(),
          description: input.description,
          date: input.date,
        });

        return { success: true };
      }),

    getMonthlyExpenses: protectedProcedure
      .input(z.object({ month: z.date() }))
      .query(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new Error("Couple not found");

        const expenses = await getMonthlyExpenses(couple.id, input.month);
        return expenses;
      }),

    getTotalSavings: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new Error("Couple not found");

      const savings = await getTotalSavings(couple.id);
      return { savings: Number(savings) || 0, target: 150000 };
    }),
  }),

  // Shopping list
  shoppingList: router({
    getItems: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new Error("Couple not found");

      return await getShoppingList(couple.id);
    }),

    addItem: protectedProcedure
      .input(z.object({
        item: z.string(),
        quantity: z.string().optional(),
        unit: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new Error("Couple not found");

        await db.insert(schema.shoppingListItems).values({
          coupleId: couple.id,
          item: input.item,
          quantity: input.quantity,
          unit: input.unit,
          category: input.category,
          createdBy: ctx.user.id,
        });

        return { success: true };
      }),

    toggleItem: protectedProcedure
      .input(z.object({ itemId: z.number(), completed: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(schema.shoppingListItems)
          .set({ completed: input.completed })
          .where(eq(schema.shoppingListItems.id, input.itemId));

        return { success: true };
      }),
  }),

  // Daily tasks
  tasks: router({
    getTasks: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new Error("Couple not found");

      return await getDailyTasks(couple.id, new Date());
    }),

    addTask: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        assignedTo: z.number().optional(),
        dueDate: z.date(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new Error("Couple not found");

        await db.insert(schema.dailyTasks).values({
          coupleId: couple.id,
          title: input.title,
          description: input.description,
          assignedTo: input.assignedTo,
          dueDate: input.dueDate,
          priority: input.priority || "medium",
          createdBy: ctx.user.id,
        });

        return { success: true };
      }),

    completeTask: protectedProcedure
      .input(z.object({ taskId: z.number(), completed: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(schema.dailyTasks)
          .set({ completed: input.completed })
          .where(eq(schema.dailyTasks.id, input.taskId));

        return { success: true };
      }),
  }),

  // Recipes
  recipes: router({
    getRecipes: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new Error("Couple not found");

      return await getRecipes(couple.id);
    }),

    addRecipe: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        ingredients: z.array(z.string()).optional(),
        instructions: z.string().optional(),
        prepTime: z.number().optional(),
        cookTime: z.number().optional(),
        servings: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new Error("Couple not found");

        await db.insert(schema.recipes).values({
          coupleId: couple.id,
          title: input.title,
          description: input.description,
          ingredients: JSON.stringify(input.ingredients || []),
          instructions: input.instructions,
          prepTime: input.prepTime,
          cookTime: input.cookTime,
          servings: input.servings,
          createdBy: ctx.user.id,
        });

        return { success: true };
      }),

    toggleFavorite: protectedProcedure
      .input(z.object({ recipeId: z.number(), isFavorite: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(schema.recipes)
          .set({ isFavorite: input.isFavorite })
          .where(eq(schema.recipes.id, input.recipeId));

        return { success: true };
      }),
  }),

  // Calendar
  calendar: router({
    getEvents: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new Error("Couple not found");

      return await getCalendarEvents(couple.id);
    }),

    addEvent: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(["savings_goal", "milestone", "couple_event", "task", "reminder"]),
        startDate: z.date(),
        endDate: z.date().optional(),
        notifyBefore: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new Error("Couple not found");

        await db.insert(schema.calendarEvents).values({
          coupleId: couple.id,
          title: input.title,
          description: input.description,
          type: input.type,
          startDate: input.startDate,
          endDate: input.endDate,
          notifyBefore: input.notifyBefore,
          createdBy: ctx.user.id,
        });

        return { success: true };
      }),
  }),

  // Receipts
  receipts: router({
    getReceipts: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new Error("Couple not found");

      return await getReceipts(couple.id);
    }),

    addReceipt: protectedProcedure
      .input(z.object({
        store: z.string(),
        photoUrl: z.string(),
        photoKey: z.string(),
        totalAmount: z.number().optional(),
        date: z.date(),
        items: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new Error("Couple not found");

        await db.insert(schema.receipts).values({
          coupleId: couple.id,
          store: input.store,
          photoUrl: input.photoUrl,
          photoKey: input.photoKey,
          totalAmount: input.totalAmount?.toString(),
          date: input.date,
          items: JSON.stringify(input.items || []),
          uploadedBy: ctx.user.id,
        });

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
