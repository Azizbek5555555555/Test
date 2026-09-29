import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getTestSets } from "@/lib/queries";
import { getTestOutlines } from "@/lib/test-outlines";
import { EmptyState, Alert } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { TestSetCard } from "@/components/test/TestSetCard";
import { PremiumSideCard } from "@/components/marketing/PremiumSideCard";
import { FaqSection, QuoteLine } from "@/components/marketing/Faq";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/format";

export const metadata: Metadata = {
  title: "Full Mock",
  description:
    "To'liq Multilevel mock testlar: Reading, Listening, Writing va Speaking bo'limlari bilan.",
};

type Access = "all" | "free" | "premium";

const FAQ = [
  {
    q: "Full Mock test real imtihondan farq qiladimi?",
    a: "Yo'q — har bir mock test Multilevel imtihonining tuzilishi, savol turlari va vaqt chegarasini to'liq takrorlaydi. Reading va Listening avtomatik baholanadi.",
  },
  {
    q: "Testni bir o'tirishda tugatishim shartmi?",
    a: "Shart emas. Javoblaringiz avtomatik saqlanadi — testni to'xtatib, keyinroq profilingizdagi \"Tugallanmagan\" bo'limidan davom ettirishingiz mumkin.",
  },
  {
    q: "Writing va Speaking qanday tekshiriladi?",
    a: "Premium testlarda Writing va Speaking javoblaringizni o'qituvchi tekshiradi va har bir bo'lim bo'yicha izoh qoldiradi. Natija tayyor bo'lganda profilingizda ko'rinadi.",
  },
  {
    q: "Bepul testlar qancha?",
    a: "Bir nechta mock test hamma uchun bepul. Qolgan testlar va to'liq tekshiruv Premium obunada ochiladi.",
  },
];

function chipHref(level: string | null, access: Access): string {
  const params = new URLSearchParams();
  if (level) params.set("level", level);
  if (access !== "all") params.set("access", access);
  const q = params.toString();
  return q ? `/full-mock?${q}` : "/full-mock";
}

export default async function FullMockPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; access?: string }>;
}) {
  const params = await searchParams;
  const [profile, testSets] = await Promise.all([
    getProfile(),
    getTestSets({ category: "full_mock" }),
  ]);

  const unlocked = profileHasPremium(profile);
  // Bo'limlar va savollar soni (Premium testlar uchun ham)
  const outlines = await getTestOutlines(testSets.map((t) => t.id));

  // Filtrlar: daraja (testlarda bo'lsa) va kirish turi
  const levels = Array.from(
    new Set(testSets.map((t) => t.level).filter((l): l is string => Boolean(l))),
  ).sort();
  const level = params.level && levels.includes(params.level) ? params.level : null;
  const access: Access =
    params.access === "free" || params.access === "premium" ? params.access : "all";

  const shown = testSets.filter(
    (t) =>
      (!level || t.level === level) &&
      (access === "all" || (access === "free" ? !t.is_premium : t.is_premium)),
  );

  return (
    <div>
      {/* ------------------------------------------------ Hero */}
      <section className="bg-gradient-to-b from-[#16213a] to-ink-950">
        <div className="container-page pb-14 pt-14 sm:pt-20">
          <div className="max-w-2xl animate-fade-up">
            <p className="eyebrow">
              <span className="h-px w-6 bg-brand-400" aria-hidden />
              Real imtihon simulyatori
            </p>
            <h1 className="display-title mt-4 text-[44px] sm:text-[56px]">Full Mock testlar</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
              Real imtihonni his qiling. Ishonch hosil qiling. O&apos;sishingizni kuzating.
              Har bir test Reading, Listening, Writing va Speaking bo&apos;limlarini
              imtihon sharoitida takrorlaydi.
            </p>
          </div>
        </div>
      </section>

      <div className="container-page pb-6">
        {!profile ? (
          <div className="mb-8">
            <Alert tone="info" title="Natijalar saqlanishi uchun">
              Testni boshlashdan oldin{" "}
              <a href="/login?next=/full-mock" className="font-bold underline">
                tizimga kiring
              </a>
              . Aks holda natijangiz profilingizga yozilmaydi.
            </Alert>
          </div>
        ) : null}

        {testSets.length === 0 ? (
          <EmptyState
            icon="📝"
            title="Hozircha mock testlar yo'q"
            description="Admin panel orqali birinchi testni qo'shing yoki supabase/seed.sql faylini ishga tushiring."
            action={<ButtonLink href="/">Bosh sahifaga</ButtonLink>}
          />
        ) : (
          <>
            {/* ------------------------------------------------ Filtrlar */}
            <nav aria-label="Filtrlar" className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {levels.length > 1
                  ? [null, ...levels].map((l) => (
                      <Link
                        key={l ?? "all"}
                        href={chipHref(l, access)}
                        scroll={false}
                        aria-current={level === l ? "true" : undefined}
                        className={cn(
                          "rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                          level === l
                            ? "bg-brand-400 text-ink-950"
                            : "border border-line bg-ink-900 text-muted hover:text-fg",
                        )}
                      >
                        {l ?? "Barcha darajalar"}
                      </Link>
                    ))
                  : (
                      <p className="text-sm text-muted">
                        Jami <strong className="text-fg">{testSets.length}</strong> ta test ·{" "}
                        <strong className="text-success">
                          {testSets.filter((t) => !t.is_premium).length}
                        </strong>{" "}
                        tasi bepul
                      </p>
                    )}
              </div>

              <div className="flex rounded-full border border-line bg-ink-900 p-1">
                {(["all", "free", "premium"] as const).map((a) => (
                  <Link
                    key={a}
                    href={chipHref(level, a)}
                    scroll={false}
                    aria-current={access === a ? "true" : undefined}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                      access === a ? "bg-brand-400 text-ink-950" : "text-muted hover:text-fg",
                    )}
                  >
                    {a === "all" ? "Barchasi" : a === "free" ? "Bepul" : "Premium"}
                  </Link>
                ))}
              </div>
            </nav>

            {/* ------------------------------------------------ Ro'yxat + Premium kartasi */}
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                {shown.length === 0 ? (
                  <div className="card p-10 text-center text-sm text-muted">
                    Bu filtr bo&apos;yicha test topilmadi.{" "}
                    <Link href="/full-mock" className="font-semibold text-brand-400 hover:underline">
                      Filtrni tozalash
                    </Link>
                  </div>
                ) : (
                  shown.map((testSet, i) => (
                    <Reveal key={testSet.id} delay={Math.min(i, 6) * 50}>
                      <TestSetCard
                        testSet={testSet}
                        questionCount={outlines[testSet.id]?.questions}
                        unlocked={unlocked}
                        href={`/tests/${testSet.slug}`}
                        sections={outlines[testSet.id]?.sections}
                        showDescription={false}
                      />
                    </Reveal>
                  ))
                )}
              </div>

              <aside className="lg:sticky lg:top-28">
                <PremiumSideCard unlocked={unlocked} premiumUntil={profile?.premium_until} />
              </aside>
            </div>
          </>
        )}
      </div>

      <div className="mt-16">
        <QuoteLine>Haqiqiy imtihondek mashq qiling — bir kun u albatta haqiqiy bo&apos;ladi.</QuoteLine>
      </div>
      <FaqSection items={FAQ} />
    </div>
  );
}
