// db/schema.ts
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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