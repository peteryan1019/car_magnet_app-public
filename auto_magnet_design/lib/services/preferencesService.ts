import type { IPreferencesRepo } from "@/lib/repos/interfaces";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export function createPreferencesService(deps: {
  preferencesRepo: IPreferencesRepo;
}) {
  const { preferencesRepo } = deps;

  async function updatePreferences(
    preferences_record: Record<string, unknown>
  ) {
    const session = await getSession();

    if (!session || !session.id) {
      return { error: "Unauthorized" };
    }

    try {
      await preferencesRepo.upsertByUserId(session.id, preferences_record);

      revalidatePath("/preferences");
      return { success: true };
    } catch (error) {
      console.error("Failed to update preferences", error);
      return { error: "Failed to update preferences" };
    }
  }

  return { updatePreferences };
}
