import { describe, it, expect, vi, beforeEach } from "vitest";
import { updatePreferencesAction } from "./actions";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { mockInsert } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: mockInsert,
      }),
    }),
  },
}));

describe("updatePreferencesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    const { getSession } = await import("@/lib/auth");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const result = await updatePreferencesAction({ theme: "dark" });
    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("upserts preferences and returns success", async () => {
    const { getSession } = await import("@/lib/auth");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "user" });
    mockInsert.mockResolvedValueOnce([]);

    const result = await updatePreferencesAction({ carType: "suv", leftSide: true });
    expect(result).toEqual({ success: true });
  });

  it("returns error when DB upsert fails", async () => {
    const { getSession } = await import("@/lib/auth");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "user" });
    mockInsert.mockRejectedValueOnce(new Error("DB constraint violation"));

    const result = await updatePreferencesAction({ carType: "suv" });
    expect(result).toEqual({ error: "Failed to update preferences" });
  });
});
