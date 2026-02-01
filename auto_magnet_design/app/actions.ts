// app/actions.ts
'use server'

import { db } from "@/db"; // Adjust path if your db folder is in root
import { users } from "@/db/schema"; // Adjust path if needed
import { count } from "drizzle-orm";

export async function testConnection() {
  try {
    // Try to count users (even if table is empty, this query checks connection)
    const result = await db.select({ count: count() }).from(users);
    return { 
      success: true, 
      message: "Connected to Neon DB successfully!", 
      userCount: result[0].count 
    };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, message: "Failed to connect to DB" };
  }
}