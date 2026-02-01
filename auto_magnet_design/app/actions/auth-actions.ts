"use server";

import { db } from "@/db";
import { users, salt as saltTable } from "@/db/schema";
import { generateSalt, hashPassword, createSession, logout } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function registerAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // Log the attempt
  console.log(`[Register Attempt] Username: ${username}`);

  if (!username || !password) {
    console.error("[Register Error] Missing fields");
    return { error: "Fields required" };
  }

  const salt = generateSalt();
  const hash = hashPassword(password, salt);

  try {
    // 1. Insert User
    const [newUser] = await db
      .insert(users)
      .values({ username, pswd_salt_hash: hash })
      .returning({ id: users.id, username: users.username });

    try {
      // 2. Insert Salt
      await db.insert(saltTable).values({
        username: newUser.username,
        salt: salt,
      });

      // 3. Create Session
      await createSession({ username: newUser.username, id: newUser.id });
      console.log(`[Register Success] User created: ${username}`);
    } catch (innerError) {
      // MANUAL ROLLBACK: If salt or session fails, remove the user
      await db.delete(users).where(eq(users.id, newUser.id));
      throw innerError;
    }
  } catch (error: any) {
    // Detailed logging of the actual error object
    console.error("[Register Failed] DB Transaction Error:", error);

    // Handle specific Postgres error codes
    if (error.code === "23505") {
      // Unique violation
      console.warn(`[Register Warning] Username '${username}' already exists.`);
      return { error: "Username already taken" };
    }

    // Generic fallback for other DB errors
    return { error: "Registration failed. Please try again later." };
  }

  redirect("/");
}

export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  console.log(`[Login Attempt] Username: ${username}`);

  try {
    // 1. Fetch User
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (!user) {
      console.warn(`[Login Failed] User not found: ${username}`);
      // Security: Return generic message to prevent username enumeration
      return { error: "Invalid credentials" };
    }

    // 2. Fetch Salt
    const [saltRecord] = await db
      .select()
      .from(saltTable)
      .where(eq(saltTable.username, username));

    if (!saltRecord) {
      // This is a critical data integrity issue (User exists but salt is gone)
      console.error(`[CRITICAL ERROR] Salt missing for user: ${username}`);
      return {
        error: "System error: Account data corrupted. Contact support.",
      };
    }

    // 3. Check Hash
    const inputHash = hashPassword(password, saltRecord.salt);

    if (inputHash !== user.pswd_salt_hash) {
      console.warn(`[Login Failed] Incorrect password for user: ${username}`);
      return { error: "Invalid credentials" };
    }

    // 4. Success
    console.log(`[Login Success] User logged in: ${username}`);
    await createSession({ username: user.username, id: user.id });
  } catch (error) {
    // Catch database connection errors (e.g. Neon is down)
    console.error("[Login Error] Unexpected Exception:", error);
    return { error: "Login failed due to a system error. Please try again." };
  }

  redirect("/");
}

export async function logoutAction() {
  try {
    await logout();
    console.log("[Logout] Session cleared");
  } catch (error) {
    console.error("[Logout Error]", error);
  }
  redirect("/login");
}
