import type { IUserRepo } from "@/lib/repos/interfaces";

export function createTestService(deps: { userRepo: IUserRepo }) {
  const { userRepo } = deps;

  async function testConnection() {
    try {
      const userCount = await userRepo.count();
      return {
        success: true,
        message: "Connected to Neon DB successfully!",
        userCount,
      };
    } catch (error) {
      console.error("Database Error:", error);
      return { success: false, message: "Failed to connect to DB" };
    }
  }

  return { testConnection };
}
