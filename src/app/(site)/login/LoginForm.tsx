"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Card";

type Step = "email" | "code";

export function LoginForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | "code" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [info, setInfo] = useState<string | null>(null);

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
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(null);
      }
      // Muvaffaqiyatli bo'lsa brauzer Google sahifasiga o'tadi
    } catch {
      setError(
        "Supabase sozlanmagan. .env.local faylini to'ldiring (SETUP.md).",
      );
      setLoading(null);
    }
  }

  /* ------------------------------------------------------- Email → kod yuborish */
  async function sendCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Email manzilini to'g'ri kiriting.");
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
        setStep("code");
        setInfo(`Tasdiqlash kodi ${trimmed} manziliga yuborildi.`);
      }
    } catch {
      setError(
        "Supabase sozlanmagan. .env.local faylini to'ldiring (SETUP.md).",
      );
    } finally {
      setLoading(null);
    }
  }

  /* ------------------------------------------------------------- Kodni tekshirish */
  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedCode = code.trim();
    if (trimmedCode.length < 6) {
      setError("6 xonali kodni to'liq kiriting.");
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
        setError(
          verifyError.message.includes("expired")
            ? "Kod muddati tugagan. Yangi kod so'rang."
            : "Kod noto'g'ri. Qaytadan urinib ko'ring.",
        );
      } else {
        // Email orqali kirganlarda ism yo'q — avval uni so'raymiz
        router.push(`/onboarding?next=${encodeURIComponent(next)}`);
        router.refresh();
      }
    } catch {
      setError("Tekshirishda xatolik yuz berdi.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {info && !error ? <Alert tone="success">{info}</Alert> : null}

      {step === "email" ? (
        <>
          {/* ----------------------------------------- Asosiy variant: Google */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={signInWithGoogle}
            disabled={loading !== null}
          >
            <GoogleIcon />
            {loading === "google" ? "Ochilmoqda…" : "Google orqali davom etish"}
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs text-muted font-semibold">yoki</span>
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {/* ------------------------------------------ Muqobil: email + kod */}
          <form onSubmit={sendCode} className="space-y-4">
            <Field
              label="Email manzilingiz"
              htmlFor="email"
              hint="Ushbu manzilga 6 xonali tasdiqlash kodi yuboriladi"
            >
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="siz@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading !== null}
              />
            </Field>

            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={loading !== null}
            >
              {loading === "email" ? "Yuborilmoqda…" : "Kod yuborish"}
            </Button>
          </form>
        </>
      ) : (
        /* --------------------------------------------------- Kodni kiritish */
        <form onSubmit={verifyCode} className="space-y-4">
          <Field
            label="Tasdiqlash kodi"
            htmlFor="code"
            hint={`${email} manziliga yuborilgan 6 xonali kod`}
          >
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="text-center text-2xl tracking-[0.4em] font-bold py-4"
              required
              autoFocus
              disabled={loading !== null}
            />
          </Field>

          <Button type="submit" size="lg" fullWidth disabled={loading !== null}>
            {loading === "code" ? "Tekshirilmoqda…" : "Tasdiqlash va kirish"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-muted hover:text-fg font-semibold"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
                setInfo(null);
              }}
            >
              ← Emailni o&apos;zgartirish
            </button>
            <button
              type="button"
              className="text-brand-600 dark:text-brand-400 hover:underline font-semibold disabled:opacity-50"
              onClick={(e) => sendCode(e as unknown as FormEvent)}
              disabled={loading !== null}
            >
              Kodni qayta yuborish
            </button>
          </div>
        </form>
      )}

      <p className="text-xs text-muted text-center leading-relaxed">
        Davom etish orqali siz platformadan foydalanish shartlariga rozilik
        bildirasiz.
      </p>
    </div>
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
