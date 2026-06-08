import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * SIM cards table - stores user's phone cards info
 */
export const simCards = mysqlTable("sim_cards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  country: varchar("country", { length: 10 }).notNull(),
  countryName: varchar("countryName", { length: 100 }).notNull(),
  carrier: varchar("carrier", { length: 100 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 50 }).notNull(),
  rechargeCycleDays: int("rechargeCycleDays").notNull(),
  lastRechargeDate: timestamp("lastRechargeDate").notNull(),
  remindDays: json("remindDays").notNull().$type<number[]>(),
  isConfirmed: boolean("isConfirmed").default(false).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SimCard = typeof simCards.$inferSelect;
export type InsertSimCard = typeof simCards.$inferInsert;

/**
 * Recharge history table - records each recharge confirmation
 */
export const rechargeHistory = mysqlTable("recharge_history", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId").notNull(),
  userId: int("userId").notNull(),
  rechargeDate: timestamp("rechargeDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RechargeHistory = typeof rechargeHistory.$inferSelect;
export type InsertRechargeHistory = typeof rechargeHistory.$inferInsert;
