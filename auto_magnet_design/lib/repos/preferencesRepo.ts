import { preferences } from "@/db/schema";
import type { IPreferencesRepo } from "./interfaces";
import type { db as dbInstance } from "@/db";

type Db = typeof dbInstance;

export function createPreferencesRepo(db: Db): IPreferencesRepo {
  return {
    async upsertByUserId(userId, data) {
      await db
        .insert(preferences)
        .values({ userId, data })
        .onConflictDoUpdate({
          target: preferences.userId,
          set: { data },
        });
    },
  };
}
