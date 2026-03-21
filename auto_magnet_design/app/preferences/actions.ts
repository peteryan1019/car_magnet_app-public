"use server";

import { db } from "@/db";
import { preferences } from "@/db/schema"; // TODO: agree on schema on main
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function updatePreferencesAction(preferences_record: Record<string, any>) {
  const session = await getSession();
  
  if (!session || !session.id) {
    return { error: "Unauthorized" };
  }

  try {
    // We use .onConflictDoUpdate to ensure the user only ever has one preference row
    await db
      .insert(preferences)
      .values({
        userId: session.id,
        data: preferences_record, // This is your JSON object
      })
      .onConflictDoUpdate({
        target: preferences.userId,
        set: { data: preferences_record },
      });

    revalidatePath("/preferences");
    return { success: true };
  } catch (error) {
    console.error("Failed to update preferences", error);
    return { error: "Failed to update preferences" };
  }
}