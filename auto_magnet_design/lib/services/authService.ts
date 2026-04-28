import type { IUserRepo, IVerificationTokenRepo } from "@/lib/repos/interfaces";
import { createSession, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { z } from "zod";
import { randomInt } from "crypto";
import transporter from "@/lib/mailer";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
});

export function createAuthService(deps: {
  userRepo: IUserRepo;
  verificationTokenRepo: IVerificationTokenRepo;
}) {
  const { userRepo, verificationTokenRepo } = deps;

  async function register(prevState: unknown, formData: FormData) {
    const validation = registerSchema.safeParse(Object.fromEntries(formData));

    if (!validation.success) {
      return { error: validation.error.issues[0].message };
    }

    const { username, email, password } = validation.data;
    console.log(`[Register Attempt] Username: ${username}, Email: ${email}`);

    try {
      const existingUser = await userRepo.findByUsernameOrEmail(
        username,
        email
      );

      if (existingUser) {
        if (existingUser.username === username)
          return { error: "Username already taken" };
        if (existingUser.email === email)
          return { error: "Email already registered" };
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const code = randomInt(100000, 1000000).toString();
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

      await verificationTokenRepo.upsertByEmail({
        email,
        username,
        password_hash: hashedPassword,
        code,
        expiresAt,
      });

      try {
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: email,
          subject: "Your AutoMagnet Verification Code",
          html: `
            <div>
              <h2>Welcome to AutoMagnet!</h2>
              <p>Your verification code is: <strong>${code}</strong></p>
              <p>This code will expire in 2 minutes.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("[Email Sending Failed]:", emailError);
        return {
          error: "Failed to send verification email. Please try again.",
        };
      }

      return { step: "verify", email };
    } catch (error: unknown) {
      console.error("[Register Failed] DB Error:", error);
      return { error: "Registration failed. Please try again later." };
    }
  }

  async function verifyAndRegister(prevState: unknown, formData: FormData) {
    const validation = verifySchema.safeParse(Object.fromEntries(formData));
    if (!validation.success)
      return { error: validation.error.issues[0].message };

    const { email, code } = validation.data;

    try {
      const token = await verificationTokenRepo.findByEmail(email);

      if (!token) return { error: "Invalid or expired verification code." };

      if (new Date() > new Date(token.expiresAt)) {
        await verificationTokenRepo.deleteByEmail(email);
        return {
          error:
            "Verification code has expired. Please try registering again.",
        };
      }

      if (token.code !== code) {
        return { error: "Incorrect verification code." };
      }

      const newUser = await userRepo.insertReturning({
        username: token.username,
        email: token.email,
        password_hash: token.password_hash,
      });

      await verificationTokenRepo.deleteByEmail(email);

      await createSession({ username: newUser.username, id: newUser.id });
      console.log(
        `[Register Success] User verified & created: ${newUser.username}`
      );
    } catch (error: unknown) {
      console.error("[Verify Failed] DB Error:", error);
      if (
        error !== null &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "23505"
      ) {
        return { error: "This user or email is already registered." };
      }
      return { error: "Verification failed. System error." };
    }

    redirect("/");
  }

  async function login(prevState: unknown, formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    console.log(`[Login Attempt] Username: ${username}`);

    if (!username || !password) {
      return { error: "Invalid credentials" };
    }

    try {
      const user = await userRepo.findByUsername(username);

      if (!user) {
        console.warn(`[Login Failed] User not found: ${username}`);
        return { error: "Invalid credentials" };
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        console.warn(
          `[Login Failed] Incorrect password for user: ${username}`
        );
        return { error: "Invalid credentials" };
      }

      console.log(`[Login Success] User logged in: ${username}`);
      await createSession({ username: user.username, id: user.id });
    } catch (error) {
      console.error("[Login Error] Unexpected Exception:", error);
      return {
        error: "Login failed due to a system error. Please try again.",
      };
    }

    redirect("/");
  }

  async function logoutUser() {
    try {
      await logout();
      console.log("[Logout] Session cleared");
    } catch (error) {
      console.error("[Logout Error]", error);
    }
    redirect("/login");
  }

  return { register, verifyAndRegister, login, logoutUser };
}
