import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, simCards, rechargeHistory, InsertSimCard, InsertRechargeHistory } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

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
      values.role = "admin";
      updateSet.role = "admin";
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

// ============ SIM Card Functions ============

export async function getUserSimCards(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(simCards).where(eq(simCards.userId, userId));
}

export async function getSimCardById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(simCards)
    .where(and(eq(simCards.id, id), eq(simCards.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSimCard(data: InsertSimCard) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(simCards).values(data);
  return result[0].insertId;
}

export async function updateSimCard(id: number, userId: number, data: Partial<InsertSimCard>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(simCards).set(data).where(and(eq(simCards.id, id), eq(simCards.userId, userId)));
}

export async function deleteSimCard(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(simCards).where(and(eq(simCards.id, id), eq(simCards.userId, userId)));
  // Also delete related recharge history
  await db.delete(rechargeHistory).where(and(eq(rechargeHistory.cardId, id), eq(rechargeHistory.userId, userId)));
}

export async function confirmRecharge(cardId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();

  // Update card: reset lastRechargeDate and isConfirmed
  await db.update(simCards).set({
    lastRechargeDate: now,
    isConfirmed: true,
  }).where(and(eq(simCards.id, cardId), eq(simCards.userId, userId)));

  // Add to recharge history
  await db.insert(rechargeHistory).values({
    cardId,
    userId,
    rechargeDate: now,
  });
}

// ============ Recharge History Functions ============

export async function getRechargeHistory(cardId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rechargeHistory)
    .where(and(eq(rechargeHistory.cardId, cardId), eq(rechargeHistory.userId, userId)));
}
