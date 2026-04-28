import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDesignService } from "@/lib/services/designService";
import type { IDesignRepo, IUserRepo } from "@/lib/repos/interfaces";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }) }));

const fakeDesignRepo: IDesignRepo = {
  insertBatch: vi.fn(), findByUserId: vi.fn(), deleteByIdAndUserId: vi.fn(), findPurchasedById: vi.fn(), markPurchased: vi.fn(),
};
const fakeUserRepo: IUserRepo = {
  findByUsernameOrEmail: vi.fn(), findByUsername: vi.fn(), findEmailById: vi.fn(), insertReturning: vi.fn(), count: vi.fn(),
};
const { saveDesigns, getDesigns, getUserEmail, deleteDesign } = createDesignService({ designRepo: fakeDesignRepo, userRepo: fakeUserRepo });

describe("Design Actions", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("saveDesigns", () => {
    it("returns Unauthorized when not logged in", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      const result = await saveDesigns(["https://example.com/img.jpg"], true);
      expect(result).toEqual({ error: "Unauthorized" });
      expect(fakeDesignRepo.insertBatch).not.toHaveBeenCalled();
    });

    it("successfully saves designs", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 10, username: "testuser" });
      (fakeDesignRepo.insertBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      const result = await saveDesigns(["https://example.com/img.jpg"], false);
      expect(result).toEqual({ success: true });
      expect(fakeDesignRepo.insertBatch).toHaveBeenCalledWith([
        { userId: 10, imageUrl: "https://example.com/img.jpg", two_doors: false },
      ]);
    });

    it("returns error when DB insert throws", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "user" });
      (fakeDesignRepo.insertBatch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("DB error"));
      const result = await saveDesigns(["https://example.com/img.jpg"], false);
      expect(result).toEqual({ error: "Failed to save designs" });
    });
  });

  describe("getDesigns", () => {
    it("redirects when not authenticated", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      await expect(getDesigns()).rejects.toThrow("REDIRECT:/login");
    });

    it("returns designs for the user", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "user" });
      const fakeDesigns = [{ id: 1, imageUrl: "https://example.com/1.png", purchased: false }];
      (fakeDesignRepo.findByUserId as ReturnType<typeof vi.fn>).mockResolvedValueOnce(fakeDesigns);
      const result = await getDesigns();
      expect(result).toEqual(fakeDesigns);
    });
  });

  describe("getUserEmail", () => {
    it("returns email when authenticated", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 5, username: "user" });
      (fakeUserRepo.findEmailById as ReturnType<typeof vi.fn>).mockResolvedValueOnce("user@example.com");
      expect(await getUserEmail()).toBe("user@example.com");
    });

    it("returns null when not authenticated", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      expect(await getUserEmail()).toBeNull();
    });
  });

  describe("deleteDesign", () => {
    it("blocks unauthenticated delete", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      const result = await deleteDesign(101);
      expect(result.error).toBe("Unauthorized");
    });

    it("successfully deletes", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "user" });
      (fakeDesignRepo.deleteByIdAndUserId as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      expect(await deleteDesign(42)).toEqual({ success: true });
    });
  });
});
