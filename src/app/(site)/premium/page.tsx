import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getPaymentSettings, getPremiumPlans, getContactSettings } from "@/lib/settings";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatDate } from "@/lib/format";
import { PageHeader, Alert } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PremiumRequestForm } from "@/components/forms/PremiumRequestForm";

export const metadata: Metadata = {
  title: "Premium",
  description:
    "Premium obuna bilan barcha mock testlar, oxirgi tushgan savollar, Exam Full Checking va Premium materiallar ochiladi.",
};

/** Hujjatning 9-bo'limi: Premium foydalanuvchi imkoniyatlari */
const PREMIUM_FEATURES = [
  { icon: "📖", text: "Barcha Reading testlar" },
  { icon: "🎧", text: "Barcha Listening testlar" },
  { icon: "📝", text: "Barcha Full Mock testlar" },
  { icon: "🗂️", text: "Oxirgi tushgan savollar (barcha yillar)" },
  { icon: "📚", text: "Premium General English materiallar" },
  { icon: "🎯", text: "Exam Full Checking — real imtihon simulyatsiyasi" },
  { icon: "🎮", text: "Qo'shimcha Vocabulary Game imkoniyatlari" },
  { icon: "📊", text: "Batafsil natijalar va tahlil" },
  { icon: "⭐", text: "Profilda PREMIUM belgisi" },
];

const FREE_FEATURES = [
  "Bepul Full Mock testlar",
  "Bepul Reading va Listening mashg'ulotlari",
  "Bepul maqolalar",
  "Vocabulary Battle (bepul to'plamlar)",
  "Leaderboardda qatnashish",
];

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  const [profile, plans, payment, contact] = await Promise.all([
    getProfile(),
    getPremiumPlans(),
    getPaymentSettings(),
    getContactSettings(),
  ]);

  const isPremium = profileHasPremium(profile);
  const hasPending = profile ? await hasPendingRequest(profile.id) : false;

  return (
    <div className="container-page py-10">
      {reason === "locked" ? (
        <div className="mb-6">
          <Alert tone="warning" title="Bu kontent qulflangan">
            Bu test faqat Premium foydalanuvchilar uchun. Premiumga
            o&apos;ting va barcha materiallarni oching.
          </Alert>
        </div>
      ) : null}

      <PageHeader
        eyebrow="Free va Premium tizimi"
        title={isPremium ? "Sizda Premium faol ⭐" : "Premiumga o'ting"}
        description={
          isPremium
            ? "Barcha imkoniyatlar siz uchun ochiq. Rahmat!"
            : "Xuddi Telegram Premium kabi — ayrim imkoniyatlar faqat Premium foydalanuvchilarga ochiladi."
        }
      />

      {isPremium && profile ? (
        <div className="card p-6 mb-8 border-gold-300 dark:border-gold-800 bg-gradient-to-r from-gold-50 to-surface dark:from-gold-950/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge tone="premium">⭐ PREMIUM FAOL</Badge>
              <p className="text-sm text-muted mt-2">
                {profile.premium_until
                  ? `Amal qilish muddati: ${formatDate(profile.premium_until)}`
                  : "Muddatsiz obuna"}
              </p>
            </div>
            <ButtonLink href="/exam-checking" variant="premium">
              🎯 Exam Full Checking
            </ButtonLink>
          </div>
        </div>
      ) : null}

      {/* -------------------------------------------- Free vs Premium */}
      <div className="grid lg:grid-cols-2 gap-5 mb-10">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-xl">Free</h2>
            <Badge tone="success">BEPUL</Badge>
          </div>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <span className="text-emerald-500 shrink-0" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted mt-5 pt-4 border-t border-line">
            Ro&apos;yxatdan o&apos;tish bepul va shart — natijalaringiz saqlanadi.
          </p>
        </div>

        <div className="card p-6 border-gold-300 dark:border-gold-800 relative overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-400 to-gold-600"
            aria-hidden
          />
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-xl">Premium</h2>
            <Badge tone="premium">⭐ PREMIUM</Badge>
          </div>
          <ul className="space-y-2.5">
            {PREMIUM_FEATURES.map((item) => (
              <li key={item.text} className="flex items-start gap-2.5 text-sm">
                <span className="shrink-0" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted mt-5 pt-4 border-t border-line">
            Keyinchalik Premiumga boshqa imkoniyatlar ham qo&apos;shiladi —
            narx o&apos;zgarmaydi.
          </p>
        </div>
      </div>

      {/* -------------------------------------------- Tariflar */}
      {!isPremium ? (
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          <div className="card p-6">
            <h2 className="font-extrabold text-xl mb-1">Tarifni tanlang</h2>
            <p className="text-sm text-muted mb-5">
              So&apos;rov yuborganingizdan keyin to&apos;lovni amalga oshirasiz
              va admin Premiumni faollashtiradi.
            </p>

            {!profile ? (
              <div className="space-y-4">
                <Alert tone="info">
                  Premium so&apos;rovi yuborish uchun avval tizimga kiring.
                </Alert>
                <ButtonLink
                  href={`/login?next=${encodeURIComponent("/premium")}`}
                  size="lg"
                  fullWidth
                >
                  Kirish / Ro&apos;yxatdan o&apos;tish
                </ButtonLink>
              </div>
            ) : (
              <PremiumRequestForm plans={plans} hasPending={hasPending} />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-3">To&apos;lov ma&apos;lumotlari</h3>
              <div className="rounded-xl bg-[var(--bg-subtle)] border border-line p-4">
                <p className="text-xs text-muted font-semibold">Karta raqami</p>
                <p className="font-extrabold text-lg tabular-nums tracking-wide mt-0.5">
                  {payment.card_number}
                </p>
                <p className="text-xs text-muted mt-2 font-semibold">
                  {payment.card_owner}
                </p>
              </div>
              <p className="text-xs text-muted mt-3 leading-relaxed">
                {payment.instruction}
              </p>
              <a
                href={contact.telegram_admin || contact.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl
                           border border-line bg-[var(--bg-subtle)] px-4 py-2.5 text-sm font-semibold
                           hover:border-brand-400 transition-colors"
              >
                ✈️ Chekni Telegramga yuborish
              </a>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-sm mb-2">Savollaringiz bormi?</h3>
              <p className="text-xs text-muted leading-relaxed mb-3">
                Premium, to&apos;lov yoki natijalar bo&apos;yicha biz bilan
                bog&apos;laning.
              </p>
              <Link
                href="/contact"
                className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Biz bilan bog&apos;lanish →
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

async function hasPendingRequest(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("premium_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}
