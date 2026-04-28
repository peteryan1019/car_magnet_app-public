"use server";

import { emailService } from "@/lib/repos/container";

export async function sendEmailAction(imageUrl: string) {
  return emailService.sendEmail(imageUrl);
}
