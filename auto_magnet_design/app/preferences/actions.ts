"use server";

import { preferencesService } from "@/lib/repos/container";

export async function updatePreferencesAction(preferences_record: Record<string, unknown>) {
  return preferencesService.updatePreferences(preferences_record);
}
