import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * /setup-check sahifasi uchun sozlamalarni tekshirish.
 *
 * Kalitlarning QIYMATI hech qachon ko'rsatilmaydi — faqat turi
 * (publishable / secret / anon JWT / service_role JWT) va uzunligi.
 */

export type CheckStatus = "ok" | "warn" | "fail";

export interface SetupCheck {
  title: string;
  status: CheckStatus;
  detail: string;
  fix?: string;
}

type KeyKind =
  | "missing"
  | "publishable"
  | "secret"
  | "jwt-anon"
  | "jwt-service"
  | "jwt-other"
  | "unknown";

interface KeyInfo {
  kind: KeyKind;
  ref: string | null;
  label: string;
}

function classifyKey(raw: string | undefined): KeyInfo {
  const value = raw?.trim();
  if (!value) return { kind: "missing", ref: null, label: "yo'q" };

  if (value.startsWith("sb_publishable_")) {
    return { kind: "publishable", ref: null, label: `Publishable key (sb_publishable_…, ${value.length} belgi)` };
  }
  if (value.startsWith("sb_secret_")) {
    return { kind: "secret", ref: null, label: `Secret key (sb_secret_…, ${value.length} belgi)` };
  }

  const parts = value.split(".");
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
        role?: string;
        ref?: string;
      };
      const ref = payload.ref ?? null;
      if (payload.role === "anon") return { kind: "jwt-anon", ref, label: "Legacy anon key (JWT)" };
      if (payload.role === "service_role") return { kind: "jwt-service", ref, label: "Legacy service_role key (JWT)" };
      return { kind: "jwt-other", ref, label: `JWT (role: ${payload.role ?? "?"})` };
    } catch {
      /* JWT emas */
    }
  }

  return { kind: "unknown", ref: null, label: `noma'lum format (${value.length} belgi)` };
}

function describeDbError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid api key") || m.includes("no api key") || m.includes("jwt") || m.includes("jws") || m.includes("pgrst301"))
    return "Kalit noto'g'ri yoki boshqa loyihaniki. Supabase → Project Settings → API Keys dan qayta nusxalang.";
  if (m.includes("could not find the table") || m.includes("does not exist") || m.includes("pgrst205"))
    return "Jadvallar topilmadi — SQL fayllar (0001–0004) shu loyihada ishga tushirilmagan.";
  if (m.includes("permission denied"))
    return "Ruxsat yo'q — 0002_policies.sql ni qayta ishga tushiring.";
  if (m.includes("fetch failed") || m.includes("enotfound") || m.includes("getaddrinfo"))
    return "Supabase manziliga ulanib bo'lmadi — URL xato yozilgan yoki internet yo'q.";
  if (m.includes("invalid supabaseurl") || m.includes("invalid url"))
    return "URL formati noto'g'ri.";
  return "Xato matnini Claude'ga yuboring.";
}

export async function runSetupDiagnostics(): Promise<SetupCheck[]> {
  const checks: SetupCheck[] = [];

  /* ------------------------------------------------------------ 1. URL */
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  let urlOk = false;
  let urlRef: string | null = null;

  if (!rawUrl) {
    checks.push({
      title: "NEXT_PUBLIC_SUPABASE_URL",
      status: "fail",
      detail: "To'ldirilmagan.",
      fix: "Supabase → Project Settings → Data API → Project URL ni nusxalang.",
    });
  } else {
    try {
      const url = new URL(rawUrl);
      const hasPath = url.pathname !== "/" && url.pathname !== "";
      if (hasPath) {
        checks.push({
          title: "NEXT_PUBLIC_SUPABASE_URL",
          status: "fail",
          detail: `Manzil oxirida ortiqcha qism bor: "${url.pathname}"`,
          fix: `Faqat shuni qoldiring: ${url.protocol}//${url.host}`,
        });
      } else if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
        checks.push({
          title: "NEXT_PUBLIC_SUPABASE_URL",
          status: "fail",
          detail: `"${url.protocol}" — https bo'lishi kerak.`,
          fix: "https:// bilan boshlanadigan Project URL ni qo'ying.",
        });
      } else {
        urlOk = true;
        if (url.hostname.endsWith(".supabase.co")) urlRef = url.hostname.split(".")[0];
        checks.push({
          title: "NEXT_PUBLIC_SUPABASE_URL",
          status: url.hostname.endsWith(".supabase.co") ? "ok" : "warn",
          detail: url.host,
          fix: url.hostname.endsWith(".supabase.co")
            ? undefined
            : "Odatda manzil .supabase.co bilan tugaydi — to'g'ri nusxalanganini tekshiring.",
        });
      }
    } catch {
      checks.push({
        title: "NEXT_PUBLIC_SUPABASE_URL",
        status: "fail",
        detail: "URL formati noto'g'ri (masalan, boshida https:// yo'q).",
        fix: "To'g'ri ko'rinish: https://abcdefgh.supabase.co",
      });
    }
  }

  /* ----------------------------------------------------- 2. Ochiq kalit */
  const anonRaw =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anon = classifyKey(anonRaw);

  if (anon.kind === "publishable" || anon.kind === "jwt-anon") {
    checks.push({ title: "NEXT_PUBLIC_SUPABASE_ANON_KEY", status: "ok", detail: anon.label });
  } else if (anon.kind === "secret" || anon.kind === "jwt-service") {
    checks.push({
      title: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      status: "fail",
      detail: `⛔ XAVFLI: bu yerda ${anon.label} turibdi — u brauzerga ochiq chiqib ketadi!`,
      fix: "Bu yerga Publishable key qo'ying. Secret key faqat SUPABASE_SERVICE_ROLE_KEY ga.",
    });
  } else {
    checks.push({
      title: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      status: "fail",
      detail: anon.kind === "missing" ? "To'ldirilmagan." : anon.label,
      fix: "Supabase → Project Settings → API Keys → Publishable key ni nusxalang (sb_publishable_ bilan boshlanadi).",
    });
  }

  /* ---------------------------------------------------- 3. Maxfiy kalit */
  const service = classifyKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (service.kind === "secret" || service.kind === "jwt-service") {
    checks.push({ title: "SUPABASE_SERVICE_ROLE_KEY", status: "ok", detail: service.label });
  } else {
    checks.push({
      title: "SUPABASE_SERVICE_ROLE_KEY",
      status: "fail",
      detail: service.kind === "missing" ? "To'ldirilmagan." : `Bu yerda ${service.label} turibdi.`,
      fix: "Supabase → Project Settings → API Keys → Secret key ni nusxalang (sb_secret_ bilan boshlanadi).",
    });
  }

  /* --------------------------------------- 4. Kalitlar shu loyihanikimi */
  for (const [name, info] of [
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", anon],
    ["SUPABASE_SERVICE_ROLE_KEY", service],
  ] as const) {
    if (urlRef && info.ref && info.ref !== urlRef) {
      checks.push({
        title: `${name} — loyiha mosligi`,
        status: "fail",
        detail: `Kalit "${info.ref}" loyihasiniki, URL esa "${urlRef}" loyihasiniki.`,
        fix: "Ikkalasini ham bitta loyihadan nusxalang.",
      });
    }
  }

  /* ----------------------------- 5. Jonli tekshiruv: sayt bazani o'qiydimi */
  if (urlOk && anonRaw && (anon.kind === "publishable" || anon.kind === "jwt-anon")) {
    try {
      const client = createClient(rawUrl!, anonRaw.trim(), {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { count, error } = await client
        .from("test_sets")
        .select("id", { count: "exact" })
        .eq("published", true)
        .limit(1);

      if (error) {
        checks.push({
          title: "Baza bilan aloqa (mehmon sifatida)",
          status: "fail",
          detail: `${error.code ? `[${error.code}] ` : ""}${error.message}`,
          fix: describeDbError(`${error.code ?? ""} ${error.message}`),
        });
      } else if (!count) {
        checks.push({
          title: "Baza bilan aloqa (mehmon sifatida)",
          status: "warn",
          detail: "Ulandi, lekin birorta ham test topilmadi.",
          fix: "supabase/seed.sql faylini SQL Editor'da ishga tushiring.",
        });
      } else {
        checks.push({
          title: "Baza bilan aloqa (mehmon sifatida)",
          status: "ok",
          detail: `Ulandi — ${count} ta test ko'rinadi.`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.push({
        title: "Baza bilan aloqa (mehmon sifatida)",
        status: "fail",
        detail: message,
        fix: describeDbError(message),
      });
    }
  }

  /* ----------------------------- 6. Jonli tekshiruv: admin kaliti ishlaydimi */
  const serviceRaw = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (urlOk && serviceRaw && (service.kind === "secret" || service.kind === "jwt-service")) {
    try {
      const admin = createClient(rawUrl!, serviceRaw, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      // To'g'ri javoblar ustunini faqat maxfiy kalit o'qiy oladi
      const { error } = await admin.from("questions").select("correct_answer").limit(1);
      checks.push(
        error
          ? {
              title: "Admin kaliti (Premium berish, javoblarni ko'rish)",
              status: "fail",
              detail: `${error.code ? `[${error.code}] ` : ""}${error.message}`,
              fix: describeDbError(`${error.code ?? ""} ${error.message}`),
            }
          : {
              title: "Admin kaliti (Premium berish, javoblarni ko'rish)",
              status: "ok",
              detail: "Ishlayapti.",
            },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.push({
        title: "Admin kaliti (Premium berish, javoblarni ko'rish)",
        status: "fail",
        detail: message,
        fix: describeDbError(message),
      });
    }
  }

  return checks;
}
