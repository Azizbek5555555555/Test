import { handleClick } from "@/lib/payments/click";

/** Click → "Prepare URL": https://<sayt>/api/payments/click/prepare */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleClick(request, 0);
}
