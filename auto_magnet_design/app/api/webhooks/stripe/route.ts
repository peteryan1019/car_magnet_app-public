import { NextRequest } from "next/server";
import { webhookService } from "@/lib/repos/container";

export async function POST(req: NextRequest) {
  return webhookService.handleWebhook(req);
}
