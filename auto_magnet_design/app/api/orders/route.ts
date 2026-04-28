import { ordersService } from "@/lib/repos/container";

export async function GET() {
  return ordersService.listOrders();
}
