"use server";

import { testService } from "@/lib/repos/container";

export async function testConnection() {
  return testService.testConnection();
}
