// db/schema.ts
import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  pswd_salt_hash: text("pswd_salt_hash").notNull(),
  date_created: timestamp("date_created").defaultNow().notNull(),
});

export const salt = pgTable("salt", {
  id: serial("id").primaryKey(),
  // references the username in the users table
  username: text("username").references(() => users.username).notNull(),
  salt: text("salt").notNull(),
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