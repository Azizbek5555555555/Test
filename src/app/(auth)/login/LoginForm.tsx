"use client";

import { useT } from "@/i18n/client";
import type { T } from "@/i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, ChevronRight, Mail } from "react-feather";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Label } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Card";
import { cn } from "@/lib/format";

type Step = "email" | "code";
type Mode = "login" | "register";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;
/** Kod holati: aniq CODE_LENGTH belgili satr, bo'sh katak = " " */
const EMPTY_CODE = " ".repeat(CODE_LENGTH);

export function LoginForm({
  next,
  initialError,
  emailEnabled,
}: {
  next: string;
  initialError?: string;
  /** Email orqali kirish (SMTP ulanganda yoqiladi — SETUP.md, 6-qadam) */
  emailEnabled: boolean;
}) {
  const router = useRouter();
  const t = useT();

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(EMPTY_CODE);
  const [loading, setLoading] = useState<"google" | "email" | "code" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  // Xato kod kiritilganda kataklar tozalanib, 1-katakka fokus qaytadi
  const [attempt, setAttempt] = useState(0);

  // "Qayta yuborish" taymeri
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  /* ---------------------------------------------------------------- Google */
  async function signInWithGoogle() {
    setError(null);
    setLoading("google");
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          // Bir nechta Google akkaunti bo'lsa — qaysi biri bilan kirishni so'raydi
          queryParams: { prompt: "select_account" },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(null);
      }
      // Muvaffaqiyatli bo'lsa brauzer Google sahifasiga o'tadi
    } catch {
      setError(t("Kirish vaqtincha ishlamayapti. Keyinroq urinib ko'ring.", "Login is temporarily unavailable. Please try again later."));
      setLoading(null);
    }
  }

  /* ------------------------------------------------------- Email → kod yuborish */
  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    setInfo(null);

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t("Email manzilini to'g'ri kiriting.", "Enter a valid email address."));
      return;
    }

    setLoading("email");
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
        },
      });

      if (otpError) {
        setError(otpError.message);
      } else {
        setEmail(trimmed);
        setCode(EMPTY_CODE);
        setStep("code");
        setResendIn(RESEND_SECONDS);
        setInfo(
          t(
            `Xatda "Sign in" havolasi bo'lsa — uni shu brauzerda oching.`,
            `If the email has a "Sign in" link, open it in this browser.`,
          ),
        );
      }
    } catch {
      setError(t("Kirish vaqtincha ishlamayapti. Keyinroq urinib ko'ring.", "Login is temporarily unavailable. Please try again later."));
    } finally {
      setLoading(null);
    }
  }

  /* ------------------------------------------------------------- Kodni tekshirish */
  async function verifyCode(value: string) {
    setError(null);

    const trimmedCode = value.replace(/\s/g, "");
    if (trimmedCode.length < CODE_LENGTH) {
      setError(t(`${CODE_LENGTH} xonali kodni to'liq kiriting.`, `Enter the full ${CODE_LENGTH}-digit code.`));
      return;
    }

    setLoading("code");
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: trimmedCode,
        type: "email",
      });

      if (verifyError) {
        // Supabase noto'g'ri va eskirgan kod uchun bir xil xato qaytaradi
        setError(
          t(
            "Kod noto'g'ri yoki muddati tugagan. Qaytadan kiriting yoki yangi kod so'rang.",
            "The code is wrong or has expired. Enter it again or request a new code.",
          ),
        );
        setCode(EMPTY_CODE);
        setAttempt((n) => n + 1);
        setLoading(null);
      } else {
        // Email orqali kirganlarda ism yo'q — avval uni so'raymiz
        router.push(`/onboarding?next=${encodeURIComponent(next)}`);
        router.refresh();
      }
    } catch {
      setError(t("Tekshirishda xatolik yuz berdi.", "Something went wrong while verifying."));
      setLoading(null);
    }
  }

  const busy = loading !== null;

  /* ============================================================ 2-qadam: kod */
  if (step === "code") {
    return (
      <div className="animate-fade-up">
        <span className="grid size-12 place-items-center rounded-xl border border-line bg-surface text-brand-400">
          <Mail size={22} strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="display-title mt-4 text-[32px]">{t("Emailni tasdiqlang", "Confirm your email")}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {t(`${CODE_LENGTH} xonali tasdiqlash kodini yubordik:`, `We sent a ${CODE_LENGTH}-digit confirmation code to:`)}{" "}
          <span className="font-semibold text-fg">{email}</span>
        </p>

        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            void verifyCode(code);
          }}
        >
          <Label htmlFor="otp-0">{t("Tasdiqlash kodi", "Confirmation code")}</Label>
          <OtpInput
            key={attempt}
            value={code}
            onChange={setCode}
            onComplete={(v) => void verifyCode(v)}
            disabled={busy}
            invalid={Boolean(error)}
            digitLabel={(n) => t(`${n}-raqam`, `Digit ${n}`)}
          />

          <div className="mt-5 space-y-3">
            {error ? <Alert tone="danger">{error}</Alert> : null}
            {info && !error ? <Alert tone="info">{info}</Alert> : null}
          </div>

          <Button type="submit" size="lg" fullWidth className="mt-7" disabled={busy}>
            {loading === "code" ? t("Tekshirilmoqda…", "Verifying…") : t("Tasdiqlash", "Confirm")}
          </Button>
        </form>

        <p className="mt-5 text-center text-[13px] text-muted">
          {t("Kod kelmadimi?", "Didn't get the code?")}{" "}
          <button
            type="button"
            className="font-semibold text-fg hover:text-brand-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-fg"
            onClick={() => void sendCode()}
            disabled={busy || resendIn > 0}
          >
            {t("Qayta yuborish", "Resend")}
            {resendIn > 0 ? ` (00:${String(resendIn).padStart(2, "0")})` : ""}
          </button>
        </p>
        <p className="mt-3 text-center">
          <button
            type="button"
            className="text-[13px] font-semibold text-muted hover:text-fg"
            onClick={() => {
              setStep("email");
              setCode(EMPTY_CODE);
              setError(null);
              setInfo(null);
            }}
          >
            ← {t("Emailni o'zgartirish", "Change email")}
          </button>
        </p>

        <Steps current={2} t={t} />
      </div>
    );
  }

  /* =========================================================== 1-qadam: kirish */
  return (
    <div>
      <h2 className="display-title text-[32px]">
        {mode === "login" ? t("Xush kelibsiz", "Welcome back") : t("Hisob yarating", "Create an account")}
      </h2>
      <p className="mt-2 text-[15px] text-muted">
        {mode === "login"
          ? t("Hisobingizga kiring va tayyorgarlikni davom ettiring.", "Log in to your account and continue preparing.")
          : t("CEFR darajangiz yo'lini bugundan kuzatib boring.", "Start tracking your CEFR path today.")}
      </p>

      {/* Kirish / Ro'yxatdan o'tish — ikkalasi bir xil jarayon, hisob avtomatik yaratiladi */}
      <div
        role="tablist"
        aria-label={t("Kirish turi", "Sign-in type")}
        className="relative mt-8 grid grid-cols-2 rounded-full border border-line bg-ink-900 p-1"
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-brand-400 transition-transform duration-300 ease-out",
            mode === "register" && "translate-x-full",
          )}
        />
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "relative z-10 rounded-full py-2.5 text-sm font-semibold transition-colors",
              mode === m ? "text-ink-950" : "text-muted hover:text-fg",
            )}
          >
            {m === "login" ? t("Kirish", "Log in") : t("Ro'yxatdan o'tish", "Sign up")}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-6">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}

      <Button
        type="button"
        variant="glass"
        size="lg"
        fullWidth
        className="mt-6 border-line bg-transparent hover:border-brand-400/60 hover:bg-white/[0.03]"
        onClick={signInWithGoogle}
        disabled={busy}
      >
        <GoogleIcon />
        {loading === "google" ? t("Ochilmoqda…", "Opening…") : t("Google orqali davom etish", "Continue with Google")}
      </Button>

      {emailEnabled ? (
        <>
          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {t("yoki email orqali", "or with email")}
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={sendCode} className="space-y-6">
            <Field label={t("Email manzil", "Email address")} htmlFor="email">
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder={t("siz@example.com", "you@example.com")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
              />
            </Field>

            <Button type="submit" size="lg" fullWidth disabled={busy}>
              {loading === "email"
                ? t("Yuborilmoqda…", "Sending…")
                : mode === "login"
                  ? t("Kod yuborish", "Send code")
                  : t("Hisob yaratish", "Create account")}
            </Button>
          </form>
        </>
      ) : null}

      <p className="mt-6 text-center text-[13px] leading-relaxed text-muted">
        {t("Davom etish orqali siz", "By continuing, you agree to the")}{" "}
        <Link href="/terms" className="text-fg underline underline-offset-2 hover:text-brand-400">
          {t("Foydalanish shartlari", "Terms of Use")}
        </Link>{" "}
        {t("va", "and")}{" "}
        <Link href="/privacy" className="text-fg underline underline-offset-2 hover:text-brand-400">
          {t("Maxfiylik siyosati", "Privacy Policy")}
        </Link>
        {t("ga rozilik bildirasiz.", ".")}
      </p>

      <Steps current={1} t={t} />
    </div>
  );
}

/* ---------------------------------------------------------------- 6 katakli kod */

/** `value` — aniq CODE_LENGTH belgili satr, bo'sh katak = " " */
function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  digitLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  digitLabel: (n: number) => string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => (value[i] ?? " ").trim());

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function focusAt(i: number) {
    const el = refs.current[Math.max(0, Math.min(CODE_LENGTH - 1, i))];
    el?.focus();
    el?.select();
  }

  function commit(arr: string[]) {
    const joined = arr.map((d) => d || " ").join("");
    onChange(joined);
    if (arr.every((d) => d)) onComplete(arr.join(""));
  }

  /** index katagidan boshlab raqamlarni joylaydi (yozish yoki nusxa qo'yish) */
  function fillFrom(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) return;
    const arr = digits.slice();
    let i = index;
    for (const ch of clean) {
      if (i >= CODE_LENGTH) break;
      arr[i++] = ch;
    }
    commit(arr);
    focusAt(i);
  }

  return (
    <div className="mt-1 flex gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          id={`otp-${i}`}
          value={d}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={digitLabel(i + 1)}
          disabled={disabled}
          onFocus={(e) => e.target.select()}
          onPaste={(e) => {
            e.preventDefault();
            fillFrom(i, e.clipboardData.getData("text"));
          }}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") {
              const arr = digits.slice();
              arr[i] = "";
              commit(arr);
              return;
            }
            // Katakda raqam bo'lsa va ustidan yozilsa — faqat yangi raqamni olamiz
            fillFrom(i, d && v.length === 2 ? (v[0] === d ? v[1] : v[0]) : v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d && i > 0) {
              e.preventDefault();
              const arr = digits.slice();
              arr[i - 1] = "";
              commit(arr);
              focusAt(i - 1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              focusAt(i - 1);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              focusAt(i + 1);
            }
          }}
          className={cn(
            "h-14 w-full min-w-0 rounded-lg border bg-surface text-center text-2xl font-semibold text-fg transition-colors",
            "focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400",
            "disabled:opacity-60",
            invalid ? "border-danger/70" : d ? "border-brand-400/50" : "border-line",
          )}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------ Qadamlar ko'rsatkichi */
function Steps({ current, t }: { current: 1 | 2; t: T }) {
  const items = [t("Kirish", "Log in"), t("Tasdiqlash", "Confirm"), t("O'rganishni boshlash", "Start learning")];
  return (
    <ol className="mt-12 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-xs" aria-label={t("Qadamlar", "Steps")}>
      {items.map((label, idx) => {
        const n = idx + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex items-center gap-2 font-medium",
                active ? "text-brand-400" : done ? "text-fg" : "text-muted",
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid size-[18px] place-items-center rounded-full text-[10px] font-semibold",
                  done && "bg-success text-ink-950",
                  active && "bg-brand-400 text-ink-950",
                  !done && !active && "border border-muted/70",
                )}
              >
                {done ? <Check size={11} strokeWidth={3} aria-hidden /> : n}
              </span>
              {label}
            </span>
            {n < items.length ? (
              <ChevronRight size={13} className="text-muted" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
