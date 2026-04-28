import type { IDesignRepo, IUserRepo } from "@/lib/repos/interfaces";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export function createDesignService(deps: {
  designRepo: IDesignRepo;
  userRepo: IUserRepo;
}) {
  const { designRepo, userRepo } = deps;

  async function saveDesigns(imageUrls: string[], two_doors: boolean) {
    const session = await getSession();
    if (!session || !session.id) {
      return { error: "Unauthorized" };
    }

    try {
      const values = imageUrls.map((url) => ({
        userId: session.id,
        imageUrl: url,
        two_doors: two_doors,
      }));

      await designRepo.insertBatch(values);
      revalidatePath("/mydesigns");
      return { success: true };
    } catch (error) {
      console.error("Failed to save designs", error);
      return { error: "Failed to save designs" };
    }
  }

  async function getDesigns() {
    const session = await getSession();

    if (!session) {
      redirect("/login");
    }

    return designRepo.findByUserId(session.id);
  }

  async function getUserEmail(): Promise<string | null> {
    const session = await getSession();
    if (!session) return null;
    return userRepo.findEmailById(session.id);
  }

  async function deleteDesign(designId: number) {
    const session = await getSession();
    if (!session || !session.id) {
      return { error: "Unauthorized" };
    }

    try {
      await designRepo.deleteByIdAndUserId(designId, session.id);

      revalidatePath("/mydesigns");
      return { success: true };
    } catch (error) {
      console.error("Failed to delete design", error);
      return { error: "Failed to delete design" };
    }
  }

  return { saveDesigns, getDesigns, getUserEmail, deleteDesign };
}
