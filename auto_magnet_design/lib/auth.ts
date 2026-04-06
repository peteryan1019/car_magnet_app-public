// lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

// --- PASSWORD LOGIC ---

export function generateSalt() {
  return crypto.randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string) {
  // PBKDF2 is a standard, secure way to hash passwords
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

// --- SESSION LOGIC ---

export async function createSession(payload: { username: string; id: number }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("48h") // Session lasts 24 hours
    .sign(secretKey);

  const cookieStore = await cookies();
  
  cookieStore.set("session", token, {
    httpOnly: true, // Javascript cannot read this (security)
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, secretKey);
    return payload as { username: string; id: number };
  } catch (error) {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}