import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPreferencesService } from "@/lib/services/preferencesService";
import type { IPreferencesRepo } from "@/lib/repos/interfaces";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fakePreferencesRepo: IPreferencesRepo = { upsertByUserId: vi.fn() };
const { updatePreferences } = createPreferencesService({ preferencesRepo: fakePreferencesRepo });

describe("updatePreferences", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns error when not authenticated", async () => {
    const { getSession } = await import("@/lib/auth");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const result = await updatePreferences({ theme: "dark" });
    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("upserts preferences and returns success", async () => {
    const { getSession } = await import("@/lib/auth");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "user" });
    (fakePreferencesRepo.upsertByUserId as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
    const result = await updatePreferences({ carType: "suv", leftSide: true });
    expect(result).toEqual({ success: true });
  });

  it("returns error when DB upsert fails", async () => {
    const { getSession } = await import("@/lib/auth");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "user" });
    (fakePreferencesRepo.upsertByUserId as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("DB error"));
    const result = await updatePreferences({ carType: "suv" });
    expect(result).toEqual({ error: "Failed to update preferences" });
  });
});
