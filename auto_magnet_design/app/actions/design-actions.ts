"use server";

import { db } from "@/db";
import { designs } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveDesignsAction(imageUrls: string[]) {
  const session = await getSession();
  if (!session || !session.id) {
    return { error: "Unauthorized" };
  }

  try {
    const values = imageUrls.map((url) => ({
      userId: session.id,
      imageUrl: url,
    }));

    await db.insert(designs).values(values);
    revalidatePath("/mydesigns");
    return { success: true };
  } catch (error) {
    console.error("Failed to save designs", error);
    return { error: "Failed to save designs" };
  }
}
