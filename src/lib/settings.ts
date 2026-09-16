import { cache } from "react";
import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import {
  DEFAULT_CEFR_BANDS,
  DEFAULT_CONTACT,
  DEFAULT_PAYMENT,
  DEFAULT_PLANS,
} from "./defaults";
import type {
  CefrBands,
  ContactSettings,
  PaymentSettings,
  PremiumPlan,
} from "./types";

export {
  DEFAULT_CEFR_BANDS,
  DEFAULT_CONTACT,
  DEFAULT_PAYMENT,
  DEFAULT_PLANS,
} from "./defaults";

type SettingsMap = Record<string, unknown>;

const loadAll = cache(async (): Promise<SettingsMap> => {
  if (!isSupabaseConfigured()) return {};
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.from("site_settings").select("key, value");
    const map: SettingsMap = {};
    for (const row of (data ?? []) as { key: string; value: unknown }[]) {
      map[row.key] = row.value;
    }
    return map;
  } catch {
    return {};
  }
});

export async function getContactSettings(): Promise<ContactSettings> {
  const all = await loadAll();
  const value = all.contact as Partial<ContactSettings> | undefined;
  return { ...DEFAULT_CONTACT, ...(value ?? {}) };
}

export async function getPremiumPlans(): Promise<PremiumPlan[]> {
  const all = await loadAll();
  const value = all.premium_plans as PremiumPlan[] | undefined;
  return Array.isArray(value) && value.length > 0 ? value : DEFAULT_PLANS;
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const all = await loadAll();
  const value = all.payment as Partial<PaymentSettings> | undefined;
  return { ...DEFAULT_PAYMENT, ...(value ?? {}) };
}

export async function getCefrBands(): Promise<CefrBands> {
  const all = await loadAll();
  const value = all.cefr_bands as Partial<CefrBands> | undefined;
  return { ...DEFAULT_CEFR_BANDS, ...(value ?? {}) };
}
