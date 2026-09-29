import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getClickConfig } from "./config";

/**
 * CLICK SHOP API — Prepare (action=0) va Complete (action=1).
 *
 * Click serveri form-urlencoded POST yuboradi. Imzo:
 *   md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id
 *       + [merchant_prepare_id — faqat Complete'da] + amount + action + sign_time)
 */

type Action = 0 | 1;

function json(body: Record<string, unknown>) {
  return Response.json(body, {
    status: 200,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });
}

async function readParams(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const data = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(data ?? {}).map(([k, v]) => [k, v == null ? "" : String(v)]),
    );
  }
  const form = await request.formData();
  const params: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") params[key] = value;
  });
  return params;
}

function signatureValid(p: Record<string, string>, secret: string, action: Action): boolean {
  const text =
    (p.click_trans_id ?? "") +
    (p.service_id ?? "") +
    secret +
    (p.merchant_trans_id ?? "") +
    (action === 1 ? (p.merchant_prepare_id ?? "") : "") +
    (p.amount ?? "") +
    (p.action ?? "") +
    (p.sign_time ?? "");
  const expected = Buffer.from(createHash("md5").update(text, "utf8").digest("hex"));
  const actual = Buffer.from((p.sign_string ?? "").toLowerCase());
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function handleClick(request: Request, action: Action) {
  let p: Record<string, string>;
  try {
    p = await readParams(request);
  } catch {
    return json({ error: -8, error_note: "Error in request from click" });
  }

  const base = {
    click_trans_id: p.click_trans_id ?? null,
    merchant_trans_id: p.merchant_trans_id ?? null,
  };

  const config = getClickConfig();
  if (!config) {
    return json({ ...base, error: -1, error_note: "SIGN CHECK FAILED!" });
  }

  const required = [
    "click_trans_id",
    "service_id",
    "merchant_trans_id",
    "amount",
    "action",
    "sign_time",
    "sign_string",
    ...(action === 1 || p.action === "1" ? ["merchant_prepare_id"] : []),
  ];
  if (required.some((key) => !p[key])) {
    return json({ ...base, error: -8, error_note: "Error in request from click" });
  }

  // Imzo so'rovdagi action bo'yicha hisoblanadi (Complete'da merchant_prepare_id ham qo'shiladi)
  const signedAction: Action = p.action === "1" ? 1 : 0;
  if (p.service_id !== config.serviceId || !signatureValid(p, config.secretKey, signedAction)) {
    return json({ ...base, error: -1, error_note: "SIGN CHECK FAILED!" });
  }

  if (Number(p.action) !== action) {
    return json({ ...base, error: -3, error_note: "Action not found" });
  }

  const clickTransId = Number(p.click_trans_id);
  const amount = Number(p.amount);
  const clickError = Number(p.error ?? 0);
  if (!Number.isSafeInteger(clickTransId) || !Number.isFinite(amount)) {
    return json({ ...base, error: -8, error_note: "Error in request from click" });
  }

  try {
    const admin = createAdminSupabase();
    if (action === 0) {
      const paydoc = Number(p.click_paydoc_id);
      const { data, error } = await admin.rpc("click_prepare", {
        p_click_trans_id: clickTransId,
        p_click_paydoc_id: Number.isSafeInteger(paydoc) ? paydoc : null,
        p_merchant_trans_id: p.merchant_trans_id,
        p_amount: amount,
        p_error: Number.isFinite(clickError) ? clickError : 0,
      });
      if (error || !data) throw new Error(error?.message ?? "no data");
      const r = data as { error: number; error_note: string; merchant_prepare_id?: number };
      return json({
        ...base,
        merchant_prepare_id: r.merchant_prepare_id ?? null,
        error: r.error,
        error_note: r.error_note,
      });
    }

    const prepareId = Number(p.merchant_prepare_id);
    if (!Number.isSafeInteger(prepareId)) {
      return json({ ...base, error: -6, error_note: "Transaction does not exist" });
    }
    const { data, error } = await admin.rpc("click_complete", {
      p_click_trans_id: clickTransId,
      p_merchant_trans_id: p.merchant_trans_id,
      p_merchant_prepare_id: prepareId,
      p_amount: amount,
      p_error: Number.isFinite(clickError) ? clickError : 0,
    });
    if (error || !data) throw new Error(error?.message ?? "no data");
    const r = data as { error: number; error_note: string; merchant_confirm_id?: number };
    return json({
      ...base,
      merchant_confirm_id: r.merchant_confirm_id ?? null,
      error: r.error,
      error_note: r.error_note,
    });
  } catch (error) {
    console.error("[click]", action === 0 ? "prepare" : "complete", error);
    return json({ ...base, error: -7, error_note: "Failed to update user" });
  }
}
