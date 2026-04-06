// db/schema.ts
import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(), // added for email logic
  password_hash: text("password_hash").notNull(), // updated to match auth-actions.ts name change
  date_created: timestamp("date_created").defaultNow().notNull(),
});

export const verificationTokens = pgTable("verificationTokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  password_hash: text("password_hash").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull(),
  imageUrl: text("imageUrl").notNull(),
  dateCreated: timestamp("dateCreated").defaultNow().notNull(),
  two_doors: boolean("two_doors").default(false).notNull(), 
});

export const preferences = pgTable("preferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).unique().notNull(),
  data: jsonb("data").notNull(),
});