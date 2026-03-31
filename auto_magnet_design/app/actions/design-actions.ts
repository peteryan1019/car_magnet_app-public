// actions/design-actions.ts
"use server";

import { db } from "@/db";
import { designs } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm"; // Make sure to import 'and' & 'eq'
import { redirect } from "next/navigation";

export async function saveDesignsAction(imageUrls: string[], two_doors: boolean) {
  // ... your existing code ...
  const session = await getSession();
  if (!session || !session.id) {
    return { error: "Unauthorized" };
  }

  try {
    const values = imageUrls.map((url) => ({
      userId: session.id,
      imageUrl: url,
      two_doors: two_doors,
    }));

    await db.insert(designs).values(values);
    revalidatePath("/mydesigns");
    return { success: true };
  } catch (error) {
    console.error("Failed to save designs", error);
    return { error: "Failed to save designs" };
  }
}

export async function getDesigns() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const userDesigns = await db
    .select()
    .from(designs)
    .where(eq(designs.userId, session.id))
    .orderBy(desc(designs.dateCreated));

  return userDesigns;
}

// Add this new action
export async function deleteDesignAction(designId: number) { // change to string if your DB uses UUIDs
  const session = await getSession();
  if (!session || !session.id) {
    return { error: "Unauthorized" };
  }

  try {
    await db
      .delete(designs)
      .where(
        and(
          eq(designs.id, designId),
          eq(designs.userId, session.id) // Security: ensure the design belongs to the user
        )
      );
      
    // Refreshes the server data so the UI updates instantly
    revalidatePath("/mydesigns"); 
    return { success: true };
  } catch (error) {
    console.error("Failed to delete design", error);
    return { error: "Failed to delete design" };
  }
}
