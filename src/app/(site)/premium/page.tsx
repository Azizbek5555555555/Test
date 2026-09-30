import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getPaymentSettings, getPremiumPlans, getContactSettings } from "@/lib/settings";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Check, Send } from "react-feather";
import { cn, formatDate, formatSum } from "@/lib/format";
import { getCourses } from "@/lib/queries";
import { COURSES_ENABLED } from "@/lib/constants";
import { Alert } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { CourseCard } from "@/components/marketing/CourseCard";
import { ContactSection } from "@/components/marketing/ContactSection";
import { PremiumRequestForm } from "@/components/forms/PremiumRequestForm";
import { OnlinePayment } from "@/components/forms/OnlinePayment";
import { PageHero } from "@/components/marketing/PageHero";
import { PremiumCard3D } from "@/components/story/PremiumCard3D";
import { getEnabledProviders } from "@/lib/payments/config";
import { getT } from "@/i18n/server";
import type { Bi } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: "Premium",
    description: t(
      "Premium obuna bilan barcha mock testlar, oxirgi tushgan savollar, Exam Full Checking va Premium materiallar ochiladi.",
      "Premium unlocks all mock tests, the latest exam questions, Exam Full Checking and Premium materials.",
    ),
  };
}

/** Hujjatning 9-bo'limi: Premium foydalanuvchi imkoniyatlari */
const PREMIUM_FEATURES: Bi[] = [
  { uz: "Barcha Reading va Listening testlar", en: "All Reading and Listening tests" },
  { uz: "Barcha Full Mock testlar — cheklovsiz", en: "All Full Mock tests — unlimited" },
  { uz: "Oxirgi tushgan savollar arxivi (barcha yillar)", en: "Latest exam questions archive (all years)" },
  { uz: "Writing va Speaking — o'qituvchi tekshiruvi", en: "Writing and Speaking — teacher review" },
  { uz: "Exam Full Checking — real imtihon simulyatsiyasi", en: "Exam Full Checking — real exam simulation" },
  { uz: "Premium maqolalar va listening skriptlari", en: "Premium articles and listening transcripts" },
  { uz: "Batafsil natijalar va profilda PREMIUM belgisi", en: "Detailed results and a PREMIUM badge on your profile" },
];

const FREE_FEATURES: { text: Bi; included: boolean }[] = [
  { text: { uz: "Vocabulary Battle va reyting", en: "Vocabulary Battle and leaderboard" }, included: true },
  { text: { uz: "Bepul Full Mock testlar", en: "Free Full Mock tests" }, included: true },
  { text: { uz: "Bepul maqolalar va listening mashqlari", en: "Free articles and listening practice" }, included: true },
  { text: { uz: "Writing va Speaking tekshiruvi", en: "Writing and Speaking review" }, included: false },
  { text: { uz: "Oxirgi yillar savollari arxivi", en: "Archive of recent years' questions" }, included: false },
];

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  const [profile, plans, payment, contact, courses, t] = await Promise.all([
    getProfile(),
    getPremiumPlans(),
    getPaymentSettings(),
    getContactSettings(),
    COURSES_ENABLED ? getCourses() : Promise.resolve([]),
    getT(),
  ]);

  const isPremium = profileHasPremium(profile);
  const providers = getEnabledProviders();
  const online = providers.length > 0;
  const hasPending = profile ? await hasPendingRequest(profile.id) : false;
  const featured = plans.find((p) => p.popular) ?? plans[0];

  return (
    <div>
      {/* ------------------------------------------------ Hero: 3D Premium kartasi */}
      <PageHero
        eyebrow={t("Kelajagingizga sarmoya", "An investment in your future")}
        title={isPremium ? t("Sizda Premium faol", "Your Premium is active") : t("Cho'qqingiz uchun qulay tariflar", "Flexible plans for your summit")}
        highlight={isPremium ? "Premium" : t("qulay tariflar", "Flexible plans")}
        hand="Invest in your future"
        actions={
          <ButtonLink href="#tariflar" size="lg" variant="premium">
            {isPremium ? t("Imkoniyatlarim", "My features") : t("Tariflarni ko'rish", "See plans")}
          </ButtonLink>
        }
        aside={<PremiumCard3D active={isPremium} />}
        className="pb-10 sm:pb-12"
      >
        {isPremium
          ? t("Barcha imkoniyatlar siz uchun ochiq. Rahmat!", "Every feature is open to you. Thank you!")
          : t(
              "Haqiqiy imtihon savollari arxivi, mock testlar va aniq diagnostik tekshiruvni oching.",
              "Unlock the real exam question archive, mock tests and precise diagnostic reviews.",
            )}
      </PageHero>

      {/* ------------------------------------------------ Tariflar */}
      <section id="tariflar" className="scroll-mt-20">
        <div className="container-page pb-20 pt-12">
          {reason === "locked" ? (
            <div className="mx-auto mb-10 max-w-3xl">
              <Alert tone="warning" title={t("Bu kontent qulflangan", "This content is locked")}>
                {t(
                  "Bu material faqat Premium foydalanuvchilar uchun. Premiumga o'ting va barcha materiallarni oching.",
                  "This material is for Premium members only. Go Premium to unlock all materials.",
                )}
              </Alert>
            </div>
          ) : null}

          <div className="mx-auto grid max-w-[880px] items-center gap-6 md:grid-cols-2">
            {/* Free */}
            <Reveal className="spot card relative rounded-2xl p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t("Standart", "Standard")}</p>
              <h2 className="display-title mt-2 text-[30px]">{t("Bepul kirish", "Free access")}</h2>
              <p className="mt-2 text-[13px] text-muted">{t("CEFR yo'lingizni bugundan to'lovsiz kuzating.", "Track your CEFR path from today, free of charge.")}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-fg">{formatSum(0, t.locale)}</span>
                <span className="text-sm text-muted">/ {t("doimiy", "forever")}</span>
              </p>
              <span aria-hidden className="my-6 block h-px bg-line" />
              <ul className="space-y-3 text-[13px]">
                {FREE_FEATURES.map((f) => (
                  <li key={f.text.uz} className={cn("flex items-center gap-2.5", f.included ? "text-fg" : "text-faint")}>
                    <Check size={15} className={f.included ? "text-success" : "text-ink-600"} aria-hidden />
                    {t(f.text)}
                  </li>
                ))}
              </ul>
              <ButtonLink
                href={profile ? "/full-mock" : "/login"}
                variant="secondary"
                fullWidth
                className="mt-8"
              >
                {profile ? t("Bepul testlarni ishlash", "Take free tests") : t("Bepul boshlash", "Start free")}
              </ButtonLink>
            </Reveal>

            {/* Premium */}
            <Reveal
              delay={100}
              className="relative rounded-2xl border-[1.5px] border-gold-400 bg-ink-800 p-8 shadow-[0_30px_80px_-40px_rgba(217,179,130,0.55)]"
            >
              <span className="absolute right-6 top-6 rounded-full bg-gold-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-950">
                {isPremium ? t("Faol", "Active") : t("Eng ommabop", "Most popular")}
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-400">{t("Elite tayyorgarlik", "Elite preparation")}</p>
              <h2 className="display-title mt-2 text-[30px]">{t("Premium kirish", "Premium access")}</h2>
              <p className="mt-2 text-[13px] text-muted">
                {t("Barcha tekshiruv vositalari, savollar arxivi va interaktiv materiallar.", "Every review tool, the question archive and interactive materials.")}
              </p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-gold-400">
                  {featured ? formatSum(featured.amount, t.locale) : "—"}
                </span>
                {featured ? (
                  <span className="text-sm text-muted">/ {featured.months} {t("oy", featured.months === 1 ? "month" : "months")}</span>
                ) : null}
              </p>
              <span aria-hidden className="my-6 block h-px bg-line" />
              <ul className="space-y-3 text-[13px] text-fg">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f.uz} className="flex items-center gap-2.5">
                    <Check size={15} className="shrink-0 text-gold-400" aria-hidden />
                    {t(f)}
                  </li>
                ))}
              </ul>
              {isPremium && profile ? (
                <>
                  <p className="mt-6 text-xs text-muted">
                    {profile.premium_until
                      ? `${t("Amal qilish muddati", "Valid until")}: ${formatDate(profile.premium_until, t.locale)}`
                      : t("Muddatsiz obuna", "Unlimited subscription")}
                  </p>
                  <ButtonLink href="/exam-checking" variant="premium" fullWidth className="mt-4">
                    Exam Full Checking
                  </ButtonLink>
                </>
              ) : (
                <ButtonLink href="#tariflar" variant="premium" fullWidth className="mt-8">
                  {t("Premiumga o'tish", "Go Premium")}
                </ButtonLink>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ To'lov */}
      {!isPremium ? (
        <section id="tariflar" className="container-page scroll-mt-28 pb-20">
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
            <div className="card rounded-2xl p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">{t("To'lov", "Payment")}</p>
              <h2 className="display-title mt-2 text-[30px]">{t("Tarifni tanlang", "Choose a plan")}</h2>
              <p className="mb-6 mt-2 text-sm text-muted">
                {online
                  ? t(
                      "Tarifni tanlang va Payme yoki Click orqali to'lang — Premium darhol yoqiladi.",
                      "Choose a plan and pay with Payme or Click — Premium turns on instantly.",
                    )
                  : t(
                      "So'rov yuborganingizdan keyin to'lovni amalga oshirasiz va admin Premiumni faollashtiradi.",
                      "After you send a request, you make the payment and an admin activates Premium.",
                    )}
              </p>

              {profile && online ? (
                <>
                  <OnlinePayment plans={plans} providers={providers} />
                  <details className="mt-6 rounded-xl border border-line p-4">
                    <summary className="cursor-pointer select-none text-sm font-semibold">
                      {t("Boshqa usul: kartaga o'tkazma va chek yuborish", "Other option: card transfer and send the receipt")}
                    </summary>
                    <div className="mt-4">
                      <PremiumRequestForm plans={plans} hasPending={hasPending} />
                    </div>
                  </details>
                </>
              ) : !profile ? (
                <div className="space-y-4">
                  <Alert tone="info">{t("Premium sotib olish uchun avval tizimga kiring.", "Log in first to buy Premium.")}</Alert>
                  <ButtonLink href={`/login?next=${encodeURIComponent("/premium#tariflar")}`} size="lg" fullWidth>
                    {t("Kirish / Ro'yxatdan o'tish", "Log in / Sign up")}
                  </ButtonLink>
                </div>
              ) : (
                <PremiumRequestForm plans={plans} hasPending={hasPending} />
              )}
            </div>

            <aside className="h-fit space-y-4 lg:sticky lg:top-28">
              <div className="rounded-2xl border border-line bg-ink-800 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {t("Kartaga o'tkazma", "Card transfer")}
                </p>
                <p className="mt-3 text-lg font-semibold tabular-nums tracking-wide text-fg">
                  {payment.card_number}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">{payment.card_owner}</p>
                <p className="mt-3 text-xs leading-relaxed text-muted">{payment.instruction}</p>
                <a
                  href={contact.telegram_admin || contact.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold transition-colors hover:border-brand-400"
                >
                  <Send size={14} aria-hidden /> {t("Chekni Telegramga yuborish", "Send the receipt on Telegram")}
                </a>
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------ Offline kurslar */}
      {courses.length > 0 ? (
        <section className="border-y border-line bg-ink-900/60">
          <div className="container-page py-20">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">
                  {t("Offline mashg'ulotlar", "Offline classes")}
                </p>
                <h2 className="display-title mt-2 text-[34px] sm:text-[44px]">{t("Intensiv kurslar", "Intensive courses")}</h2>
              </div>
              <Link href="/courses" className="text-sm font-semibold text-brand-400 hover:text-brand-300">
                {t("Barcha kurslar", "All courses")} →
              </Link>
            </Reveal>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 3).map((course, i) => (
                <Reveal key={course.id} delay={i * 80}>
                  <CourseCard course={course} index={i} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------ Aloqa */}
      <section className="container-page py-20">
        <ContactSection
          contact={contact}
          defaults={{ name: profile?.full_name, email: profile?.email, phone: profile?.phone }}
        />
      </section>
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
