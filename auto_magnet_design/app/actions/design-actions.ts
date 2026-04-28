"use server";

import { designService } from "@/lib/repos/container";

export async function saveDesignsAction(imageUrls: string[], two_doors: boolean) {
  return designService.saveDesigns(imageUrls, two_doors);
}

export async function getDesigns() {
  return designService.getDesigns();
}

export async function getUserEmail(): Promise<string | null> {
  return designService.getUserEmail();
}

export async function deleteDesignAction(designId: number) {
  return designService.deleteDesign(designId);
}
