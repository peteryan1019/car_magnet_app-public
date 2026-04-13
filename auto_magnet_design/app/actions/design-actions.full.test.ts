import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserEmail, getDesigns, deleteDesignAction, saveDesignsAction } from "./design-actions";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const { mockInsert, mockSelectWhere, mockDelete, mockOrderBy } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockSelectWhere: vi.fn(),
  mockDelete: vi.fn(),
  mockOrderBy: vi.fn(),
}));

// getDesigns calls .where().orderBy() while getUserEmail calls .where() directly
mockSelectWhere.mockReturnValue({ orderBy: mockOrderBy });

vi.mock("@/db", () => ({
  db: {
    select: () => ({ from: () => ({ where: mockSelectWhere }) }),
    insert: () => ({ values: mockInsert }),
    delete: () => ({ where: mockDelete }),
  },
}));

describe("Design Actions - Extended", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserEmail", () => {
    it("returns user email when authenticated", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 5, username: "user" });
      mockSelectWhere.mockResolvedValueOnce([{ email: "user@example.com" }]).mockReturnValue({ orderBy: mockOrderBy });

      const email = await getUserEmail();
      expect(email).toBe("user@example.com");
    });

    it("returns null when not authenticated", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const email = await getUserEmail();
      expect(email).toBeNull();
    });

    it("returns null when user is not found in DB", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 999, username: "ghost" });
      mockSelectWhere.mockResolvedValueOnce([]).mockReturnValue({ orderBy: mockOrderBy });

      const email = await getUserEmail();
      expect(email).toBeNull();
    });
  });

  describe("getDesigns", () => {
    it("redirects to /login when not authenticated", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      await expect(getDesigns()).rejects.toThrow("REDIRECT:/login");
    });

    it("returns designs for the authenticated user", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "user" });
      const fakeDesigns = [
        { id: 1, imageUrl: "https://example.com/1.png", purchased: false },
        { id: 2, imageUrl: "https://example.com/2.png", purchased: true },
      ];
      mockOrderBy.mockResolvedValueOnce(fakeDesigns);

      const result = await getDesigns();
      expect(result).toEqual(fakeDesigns);
    });
  });

  describe("saveDesignsAction", () => {
    it("returns error when session has no id", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ username: "user" });

      const result = await saveDesignsAction(["https://example.com/img.png"], false);
      expect(result).toEqual({ error: "Unauthorized" });
    });

    it("returns error when DB insert throws", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "user" });
      mockInsert.mockRejectedValueOnce(new Error("DB error"));

      const result = await saveDesignsAction(["https://example.com/img.png"], false);
      expect(result).toEqual({ error: "Failed to save designs" });
    });

    it("saves multiple image URLs in a batch", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 10, username: "user" });
      mockInsert.mockResolvedValueOnce([]);

      const urls = ["https://example.com/1.png", "https://example.com/2.png", "https://example.com/3.png"];
      const result = await saveDesignsAction(urls, true);

      expect(result).toEqual({ success: true });
      expect(mockInsert).toHaveBeenCalledWith([
        { userId: 10, imageUrl: "https://example.com/1.png", two_doors: true },
        { userId: 10, imageUrl: "https://example.com/2.png", two_doors: true },
        { userId: 10, imageUrl: "https://example.com/3.png", two_doors: true },
      ]);
    });
  });

  describe("deleteDesignAction", () => {
    it("successfully deletes a design when authorized", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "user" });
      mockDelete.mockResolvedValueOnce([]);

      const result = await deleteDesignAction(42);
      expect(result).toEqual({ success: true });
    });

    it("returns error when DB delete throws", async () => {
      const { getSession } = await import("@/lib/auth");
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "user" });
      mockDelete.mockRejectedValueOnce(new Error("DB error"));

      const result = await deleteDesignAction(42);
      expect(result).toEqual({ error: "Failed to delete design" });
    });
  });
});
