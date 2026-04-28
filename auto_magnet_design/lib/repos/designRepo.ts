import { designs } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { IDesignRepo } from "./interfaces";
import type { db as dbInstance } from "@/db";

type Db = typeof dbInstance;

export function createDesignRepo(db: Db): IDesignRepo {
  return {
    async insertBatch(values) {
      await db.insert(designs).values(values);
    },

    async findByUserId(userId) {
      return db
        .select()
        .from(designs)
        .where(eq(designs.userId, userId))
        .orderBy(desc(designs.dateCreated));
    },

    async deleteByIdAndUserId(designId, userId) {
      await db
        .delete(designs)
        .where(and(eq(designs.id, designId), eq(designs.userId, userId)));
    },

    async findPurchasedById(designId) {
      const [design] = await db
        .select({ purchased: designs.purchased })
        .from(designs)
        .where(eq(designs.id, designId));
      return design ?? null;
    },

    async markPurchased(designId) {
      await db
        .update(designs)
        .set({ purchased: true })
        .where(eq(designs.id, designId));
    },
  };
}
