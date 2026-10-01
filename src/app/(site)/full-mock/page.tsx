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
import { PageHero } from "@/components/marketing/PageHero";
import { MockBooklets } from "@/components/story/MockBooklets";
import { EXAMINER_NAME, REVIEW_HOURS } from "@/lib/constants";
import { getT } from "@/i18n/server";
import type { T } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: "Full Mock",
    description: t(
      "To'liq Multilevel mock testlar: Reading, Listening, Writing va Speaking bo'limlari bilan.",
      "Full Multilevel mock tests with Reading, Listening, Writing and Speaking sections.",
    ),
  };
}

type Access = "all" | "free" | "premium";

const faq = (t: T) => [
  {
    q: t("Full Mock test real imtihondan farq qiladimi?", "Is a Full Mock test different from the real exam?"),
    a: t(
      "Yo'q — har bir mock test Multilevel imtihonining tuzilishi, savol turlari va vaqt chegarasini to'liq takrorlaydi. Reading va Listening avtomatik baholanadi.",
      "No — every mock test fully mirrors the Multilevel exam's structure, question types and time limits. Reading and Listening are marked automatically.",
    ),
  },
  {
    q: t("Testni bir o'tirishda tugatishim shartmi?", "Do I have to finish the test in one sitting?"),
    a: t(
      "Shart emas. Javoblaringiz avtomatik saqlanadi — testni to'xtatib, keyinroq profilingizdagi \"Tugallanmagan\" bo'limidan davom ettirishingiz mumkin.",
      "No. Your answers are saved automatically — you can pause and continue later from the \"Unfinished\" section of your profile.",
    ),
  },
  {
    q: t("Writing va Speaking qanday tekshiriladi?", "How are Writing and Speaking checked?"),
    a: t(
      `Premium testlarda Writing va Speaking javoblaringizni tekshiruvchi ${EXAMINER_NAME} ${REVIEW_HOURS} soat ichida rasmiy Multilevel mezonlari bo'yicha baholaydi (har biri 0–75 ball) va izoh qoldiradi. Natija profilingizda ko'rinadi.`,
      `In Premium tests our examiner ${EXAMINER_NAME} grades your Writing and Speaking within ${REVIEW_HOURS} hours using the official Multilevel criteria (each 0–75) and leaves feedback. The result appears in your profile.`,
    ),
  },
  {
    q: t("Bepul testlar qancha?", "How many tests are free?"),
    a: t(
      "Bir nechta mock test hamma uchun bepul. Qolgan testlar va to'liq tekshiruv Premium obunada ochiladi.",
      "Several mock tests are free for everyone. The rest, plus full reviews, are unlocked with Premium.",
    ),
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
  const [profile, testSets, t] = await Promise.all([
    getProfile(),
    getTestSets({ category: "full_mock" }),
    getT(),
  ]);

  const unlocked = profileHasPremium(profile);
  // Bo'limlar va savollar soni (Premium testlar uchun ham)
  const outlines = await getTestOutlines(testSets.map((s) => s.id));

  // Filtrlar: daraja (testlarda bo'lsa) va kirish turi
  const levels = Array.from(
    new Set(testSets.map((s) => s.level).filter((l): l is string => Boolean(l))),
  ).sort();
  const level = params.level && levels.includes(params.level) ? params.level : null;
  const access: Access =
    params.access === "free" || params.access === "premium" ? params.access : "all";

  const shown = testSets.filter(
    (s) =>
      (!level || s.level === level) &&
      (access === "all" || (access === "free" ? !s.is_premium : s.is_premium)),
  );

  return (
    <div>
      {/* ------------------------------------------------ Hero: 3D daftarchalar */}
      <PageHero
        eyebrow={t("Real imtihon simulyatori", "Real exam simulator")}
        title={t("Full Mock testlar", "Full Mock tests")}
        highlight="Full Mock"
        hand="Feel the real exam"
        aside={<MockBooklets />}
        className="pb-10 sm:pb-12"
      >
        {t(
          "Real imtihonni his qiling. Ishonch hosil qiling. O'sishingizni kuzating. Har bir test Reading, Listening, Writing va Speaking bo'limlarini imtihon sharoitida takrorlaydi.",
          "Feel the real exam. Build confidence. Track your growth. Every test recreates the Reading, Listening, Writing and Speaking sections under exam conditions.",
        )}
      </PageHero>

      <div className="container-page pb-6 pt-10">
        {!profile ? (
          <div className="mb-8">
            <Alert tone="info" title={t("Natijalar saqlanishi uchun", "To save your results")}>
              {t("Testni boshlashdan oldin", "Before you start,")}{" "}
              <a href="/login?next=/full-mock" className="font-bold underline">
                {t("tizimga kiring", "log in")}
              </a>
              {t(". Aks holda natijangiz profilingizga yozilmaydi.", ". Otherwise your result will not be saved to your profile.")}
            </Alert>
          </div>
        ) : null}

        {testSets.length === 0 ? (
          <EmptyState
            icon="📝"
            title={t("Hozircha mock testlar yo'q", "No mock tests yet")}
            description={t("Tez orada yangi testlar qo'shiladi.", "New tests are coming soon.")}
            action={<ButtonLink href="/">{t("Bosh sahifaga", "Back to home")}</ButtonLink>}
          />
        ) : (
          <>
            {/* ------------------------------------------------ Filtrlar */}
            <nav aria-label={t("Filtrlar", "Filters")} className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
                        {l ?? t("Barcha darajalar", "All levels")}
                      </Link>
                    ))
                  : (
                      <p className="text-sm text-muted">
                        {t("Jami", "Total")} <strong className="text-fg">{testSets.length}</strong>{" "}
                        {t("ta test", "tests")} ·{" "}
                        <strong className="text-success">
                          {testSets.filter((s) => !s.is_premium).length}
                        </strong>{" "}
                        {t("tasi bepul", "free")}
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
                    {a === "all" ? t("Barchasi", "All") : a === "free" ? t("Bepul", "Free") : "Premium"}
                  </Link>
                ))}
              </div>
            </nav>

            {/* ------------------------------------------------ Ro'yxat + Premium kartasi */}
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                {shown.length === 0 ? (
                  <div className="card p-10 text-center text-sm text-muted">
                    {t("Bu filtr bo'yicha test topilmadi.", "No tests match this filter.")}{" "}
                    <Link href="/full-mock" className="font-semibold text-brand-400 hover:underline">
                      {t("Filtrni tozalash", "Clear filter")}
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
        <QuoteLine>{t("Haqiqiy imtihondek mashq qiling — bir kun u albatta haqiqiy bo'ladi.", "Practise as if it were the real exam — one day it will be.")}</QuoteLine>
      </div>
      <FaqSection items={faq(t)} />
    </div>
  );
}
