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
import { getEnabledProviders } from "@/lib/payments/config";

export const metadata: Metadata = {
  title: "Premium",
  description:
    "Premium obuna bilan barcha mock testlar, oxirgi tushgan savollar, Exam Full Checking va Premium materiallar ochiladi.",
};

/** Hujjatning 9-bo'limi: Premium foydalanuvchi imkoniyatlari */
const PREMIUM_FEATURES = [
  "Barcha Reading va Listening testlar",
  "Barcha Full Mock testlar — cheklovsiz",
  "Oxirgi tushgan savollar arxivi (barcha yillar)",
  "Writing va Speaking — o'qituvchi tekshiruvi",
  "Exam Full Checking — real imtihon simulyatsiyasi",
  "Premium maqolalar va listening skriptlari",
  "Batafsil natijalar va profilda PREMIUM belgisi",
];

const FREE_FEATURES: { text: string; included: boolean }[] = [
  { text: "Vocabulary Battle va reyting", included: true },
  { text: "Bepul Full Mock testlar", included: true },
  { text: "Bepul maqolalar va listening mashqlari", included: true },
  { text: "Writing va Speaking tekshiruvi", included: false },
  { text: "Oxirgi yillar savollari arxivi", included: false },
];

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  const [profile, plans, payment, contact, courses] = await Promise.all([
    getProfile(),
    getPremiumPlans(),
    getPaymentSettings(),
    getContactSettings(),
    COURSES_ENABLED ? getCourses() : Promise.resolve([]),
  ]);

  const isPremium = profileHasPremium(profile);
  const providers = getEnabledProviders();
  const online = providers.length > 0;
  const hasPending = profile ? await hasPendingRequest(profile.id) : false;
  const featured = plans.find((p) => p.popular) ?? plans[0];

  return (
    <div>
      {/* ------------------------------------------------ Tariflar */}
      <section className="bg-gradient-to-b from-[#16213a] to-ink-950">
        <div className="container-page pb-20 pt-14 sm:pt-20">
          {reason === "locked" ? (
            <div className="mx-auto mb-10 max-w-3xl">
              <Alert tone="warning" title="Bu kontent qulflangan">
                Bu material faqat Premium foydalanuvchilar uchun. Premiumga o&apos;ting va barcha
                materiallarni oching.
              </Alert>
            </div>
          ) : null}

          <div className="mx-auto max-w-2xl animate-fade-up text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-400">
              Kelajagingizga sarmoya
            </p>
            <h1 className="display-title mt-3 text-[40px] sm:text-[52px]">
              {isPremium ? "Sizda Premium faol" : "Cho'qqingiz uchun qulay tariflar"}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {isPremium
                ? "Barcha imkoniyatlar siz uchun ochiq. Rahmat!"
                : "Haqiqiy imtihon savollari arxivi, mock testlar va aniq diagnostik tekshiruvni oching."}
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-[880px] items-center gap-6 md:grid-cols-2">
            {/* Free */}
            <Reveal className="card rounded-2xl p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Standart</p>
              <h2 className="display-title mt-2 text-[30px]">Bepul kirish</h2>
              <p className="mt-2 text-[13px] text-muted">CEFR yo&apos;lingizni bugundan to&apos;lovsiz kuzating.</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-fg">0 so&apos;m</span>
                <span className="text-sm text-muted">/ doimiy</span>
              </p>
              <span aria-hidden className="my-6 block h-px bg-line" />
              <ul className="space-y-3 text-[13px]">
                {FREE_FEATURES.map((f) => (
                  <li key={f.text} className={cn("flex items-center gap-2.5", f.included ? "text-fg" : "text-faint")}>
                    <Check size={15} className={f.included ? "text-success" : "text-ink-600"} aria-hidden />
                    {f.text}
                  </li>
                ))}
              </ul>
              <ButtonLink
                href={profile ? "/full-mock" : "/login"}
                variant="secondary"
                fullWidth
                className="mt-8"
              >
                {profile ? "Bepul testlarni ishlash" : "Bepul boshlash"}
              </ButtonLink>
            </Reveal>

            {/* Premium */}
            <Reveal
              delay={100}
              className="relative rounded-2xl border-[1.5px] border-gold-400 bg-ink-800 p-8 shadow-[0_30px_80px_-40px_rgba(217,179,130,0.55)]"
            >
              <span className="absolute right-6 top-6 rounded-full bg-gold-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-950">
                {isPremium ? "Faol" : "Eng ommabop"}
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-400">Elite tayyorgarlik</p>
              <h2 className="display-title mt-2 text-[30px]">Premium kirish</h2>
              <p className="mt-2 text-[13px] text-muted">
                Barcha tekshiruv vositalari, savollar arxivi va interaktiv materiallar.
              </p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-gold-400">
                  {featured ? formatSum(featured.amount) : "—"}
                </span>
                {featured ? (
                  <span className="text-sm text-muted">/ {featured.months} oy</span>
                ) : null}
              </p>
              <span aria-hidden className="my-6 block h-px bg-line" />
              <ul className="space-y-3 text-[13px] text-fg">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check size={15} className="shrink-0 text-gold-400" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              {isPremium && profile ? (
                <>
                  <p className="mt-6 text-xs text-muted">
                    {profile.premium_until
                      ? `Amal qilish muddati: ${formatDate(profile.premium_until)}`
                      : "Muddatsiz obuna"}
                  </p>
                  <ButtonLink href="/exam-checking" variant="premium" fullWidth className="mt-4">
                    Exam Full Checking
                  </ButtonLink>
                </>
              ) : (
                <ButtonLink href="#tariflar" variant="premium" fullWidth className="mt-8">
                  Premiumga o&apos;tish
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">To&apos;lov</p>
              <h2 className="display-title mt-2 text-[30px]">Tarifni tanlang</h2>
              <p className="mb-6 mt-2 text-sm text-muted">
                {online
                  ? "Tarifni tanlang va Payme yoki Click orqali to'lang — Premium darhol yoqiladi."
                  : "So'rov yuborganingizdan keyin to'lovni amalga oshirasiz va admin Premiumni faollashtiradi."}
              </p>

              {profile && online ? (
                <>
                  <OnlinePayment plans={plans} providers={providers} />
                  <details className="mt-6 rounded-xl border border-line p-4">
                    <summary className="cursor-pointer select-none text-sm font-semibold">
                      Boshqa usul: kartaga o&apos;tkazma va chek yuborish
                    </summary>
                    <div className="mt-4">
                      <PremiumRequestForm plans={plans} hasPending={hasPending} />
                    </div>
                  </details>
                </>
              ) : !profile ? (
                <div className="space-y-4">
                  <Alert tone="info">Premium sotib olish uchun avval tizimga kiring.</Alert>
                  <ButtonLink href={`/login?next=${encodeURIComponent("/premium#tariflar")}`} size="lg" fullWidth>
                    Kirish / Ro&apos;yxatdan o&apos;tish
                  </ButtonLink>
                </div>
              ) : (
                <PremiumRequestForm plans={plans} hasPending={hasPending} />
              )}
            </div>

            <aside className="h-fit space-y-4 lg:sticky lg:top-28">
              <div className="rounded-2xl border border-line bg-ink-800 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Kartaga o&apos;tkazma
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
                  <Send size={14} aria-hidden /> Chekni Telegramga yuborish
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
                  Offline mashg&apos;ulotlar
                </p>
                <h2 className="display-title mt-2 text-[34px] sm:text-[44px]">Intensiv kurslar</h2>
              </div>
              <Link href="/courses" className="text-sm font-semibold text-brand-400 hover:text-brand-300">
                Barcha kurslar →
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
