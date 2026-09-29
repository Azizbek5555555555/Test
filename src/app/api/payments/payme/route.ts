import { timingSafeEqual } from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getPaymeConfig } from "@/lib/payments/config";

/**
 * PAYME MERCHANT API (JSON-RPC 2.0).
 *
 * Payme serveri shu manzilga so'rov yuboradi:
 *   https://<sayt>/api/payments/payme
 * (Payme Business kabinetida "Endpoint URL" sifatida kiritiladi.)
 *
 * Avtorizatsiya: "Authorization: Basic base64(Paycom:<KALIT>)".
 * Tranzaksiya mantiqi bazadagi payme_handle() funksiyasida — u holatlarni
 * qulflab, bir vaqtda kelgan takroriy so'rovlarda ham to'g'ri ishlaydi.
 * Javob har doim HTTP 200 bilan qaytadi (Payme talabi).
 */

export const dynamic = "force-dynamic";

type RpcId = string | number | null;

function reply(id: RpcId, payload: Record<string, unknown>) {
  return Response.json(
    { jsonrpc: "2.0", id, ...payload },
    { status: 200, headers: { "Content-Type": "application/json; charset=UTF-8" } },
  );
}

function rpcError(id: RpcId, code: number, uz: string, ru: string, en: string) {
  return reply(id, { error: { code, message: { uz, ru, en } } });
}

function isAuthorized(header: string | null, key: string): boolean {
  if (!header?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6).trim(), "base64").toString("utf8");
  } catch {
    return false;
  }
  const expected = Buffer.from(`Paycom:${key}`, "utf8");
  const actual = Buffer.from(decoded, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const isNum = (value: unknown) => typeof value === "number" && Number.isFinite(value);
const isStr = (value: unknown) => typeof value === "string" && value.length > 0 && value.length <= 64;

/** Har bir metod uchun majburiy maydonlar */
function paramsValid(method: string, params: Record<string, unknown>): boolean {
  const account = params.account;
  switch (method) {
    case "CheckPerformTransaction":
      return isNum(params.amount) && typeof account === "object" && account !== null;
    case "CreateTransaction":
      return (
        isStr(params.id) &&
        isNum(params.time) &&
        isNum(params.amount) &&
        typeof account === "object" &&
        account !== null
      );
    case "PerformTransaction":
    case "CheckTransaction":
      return isStr(params.id);
    case "CancelTransaction":
      return isStr(params.id) && isNum(params.reason);
    case "GetStatement":
      return isNum(params.from) && isNum(params.to);
    default:
      return true; // noma'lum metodga baza "Method not found" qaytaradi
  }
}

export async function POST(request: Request) {
  let body: { id?: RpcId; method?: unknown; params?: unknown };
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, "JSON xato", "Ошибка парсинга JSON", "Parse error");
  }

  const id: RpcId =
    typeof body?.id === "number" || typeof body?.id === "string" ? body.id : null;

  const config = getPaymeConfig();
  if (!config || !isAuthorized(request.headers.get("authorization"), config.key)) {
    return rpcError(id, -32504, "Ruxsat yo'q", "Недостаточно привилегий", "Insufficient privileges");
  }

  const method = body?.method;
  const params = body?.params;
  if (
    typeof method !== "string" ||
    typeof params !== "object" ||
    params === null ||
    Array.isArray(params) ||
    !paramsValid(method, params as Record<string, unknown>)
  ) {
    return rpcError(id, -32600, "So'rov noto'g'ri", "Неверный запрос", "Invalid request");
  }

  try {
    const { data, error } = await createAdminSupabase().rpc("payme_handle", {
      p_method: method,
      p_params: params,
    });
    if (error || !data) {
      console.error("[payme]", method, error?.message);
      return rpcError(id, -32400, "Tizim xatosi", "Системная ошибка", "System error");
    }
    return reply(id, data as Record<string, unknown>);
  } catch (error) {
    console.error("[payme]", method, error);
    return rpcError(id, -32400, "Tizim xatosi", "Системная ошибка", "System error");
  }
}

export async function GET() {
  return rpcError(null, -32300, "Faqat POST", "Метод запроса не POST", "Request method must be POST");
}
