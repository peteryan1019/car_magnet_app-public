import { users, verificationTokens } from "@/db/schema";
import { eq, or, count } from "drizzle-orm";
import type { IUserRepo, IVerificationTokenRepo } from "./interfaces";
import type { db as dbInstance } from "@/db";

type Db = typeof dbInstance;

export function createUserRepo(db: Db): IUserRepo {
  return {
    async findByUsernameOrEmail(username, email) {
      const [user] = await db
        .select()
        .from(users)
        .where(or(eq(users.username, username), eq(users.email, email)));
      return user ?? null;
    },

    async findByUsername(username) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      return user ?? null;
    },

    async findEmailById(userId) {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId));
      return user?.email ?? null;
    },

    async insertReturning(data) {
      const [newUser] = await db
        .insert(users)
        .values(data)
        .returning({ id: users.id, username: users.username });
      return newUser;
    },

    async count() {
      const [result] = await db.select({ count: count() }).from(users);
      return result.count;
    },
  };
}

export function createVerificationTokenRepo(db: Db): IVerificationTokenRepo {
  return {
    async upsertByEmail(data) {
      await db
        .insert(verificationTokens)
        .values(data)
        .onConflictDoUpdate({
          target: verificationTokens.email,
          set: {
            username: data.username,
            password_hash: data.password_hash,
            code: data.code,
            expiresAt: data.expiresAt,
          },
        });
    },

    async findByEmail(email) {
      const [token] = await db
        .select()
        .from(verificationTokens)
        .where(eq(verificationTokens.email, email));
      return token ?? null;
    },

    async deleteByEmail(email) {
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.email, email));
    },
  };
}
