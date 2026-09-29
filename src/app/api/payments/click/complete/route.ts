import { handleClick } from "@/lib/payments/click";

/** Click → "Complete URL": https://<sayt>/api/payments/click/complete */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleClick(request, 1);
}
