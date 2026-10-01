import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "react-feather";
import { getProfile } from "@/lib/auth";
import { getCourses } from "@/lib/queries";
import { getLearnerSnapshot, getSiteStats, greeting } from "@/lib/home";
import { FlameIcon } from "@/components/ui/icons";
import { COURSES_ENABLED, SITE_TAGLINE } from "@/lib/constants";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { HomeStory } from "@/components/story/HomeStory";
import { AmbientBackdrop } from "@/components/story/AmbientBackdrop";
import { ResultReveal } from "@/components/story/ResultReveal";
import { StatsReveal } from "@/components/home/StatsReveal";
import { AboutPeak } from "@/components/home/AboutPeak";
import { getT } from "@/i18n/server";
import {
  CompareTable,
  CoursesStrip,
  FeatureGrid,
  PullQuote,
  Roadmap,
  SearchBar,
  SectionTitle,
  SkillModules,
  featureItems,
} from "@/components/home/Sections";

/**
 * Bosh sahifa — Figma: 01-homepage-before-login va 03-homepage-after-login.
 */
export default async function HomePage() {
  const profile = await getProfile();
  return profile ? <LearnerHome name={profile.full_name} /> : <GuestHome />;
}

/* ============================================================================
   MEHMON (kirmagan foydalanuvchi)
   ============================================================================ */
async function GuestHome() {
  const [stats, courses, t] = await Promise.all([
    getSiteStats(),
    COURSES_ENABLED ? getCourses() : Promise.resolve([]),
    getT(),
  ]);

  return (
    <>
      <HomeStory stats={stats} />
      <AmbientBackdrop>

      <StatsReveal
        eyebrow={t("Platforma raqamlarda", "The platform in numbers")}
        items={[
          { value: stats.fullMocks, label: t("Full Mock test", "Full Mock tests"), icon: "mock" },
          { value: stats.listeningSets, label: t("Listening mashqi", "Listening sets"), icon: "listening" },
          { value: stats.articles, label: t("Maqola", "Articles"), icon: "article" },
          { value: stats.questions, label: t("Savollar bazasi", "Question bank"), icon: "question" },
        ]}
      />

      {/* 3D natija varaqasi + oltin chiziqlar */}
      <ResultReveal />

      {/* ------------------------------------------------------- VOSITALAR */}
      <section className="container-page py-20">
        <SectionTitle eyebrow={t("Platforma imkoniyatlari", "Platform features")} title={t("Cho'qqiga chiqish uchun vositalar", "Tools for reaching the summit")} />
        <FeatureGrid items={featureItems({ coursesEnabled: COURSES_ENABLED, icons: "stars" }, t)} />
      </section>

      <CompareTable />

      <PullQuote>{t("Davom eting. Siz yorqinroq kelajakni qurayapsiz.", "Keep going. You are building a brighter future.")}</PullQuote>

      <Roadmap />

      {/* --------------------------------------------------------- HAQIMIZDA */}
      <AboutSection />

      {COURSES_ENABLED ? <CoursesStrip courses={courses} /> : null}
      </AmbientBackdrop>
    </>
  );
}

async function AboutSection() {
  const t = await getT();
  return (
    <section className="container-page py-20" id="about">
      <AboutPeak
        copy={{
          eyebrow: t("Biz haqimizda", "About us"),
          quote: t("Har bir qadam cho'qqi sari puxta chizilgan.", "Every step is carefully mapped toward the summit."),
          hand: SITE_TAGLINE,
          paragraphs: [
            t(
              "levelxenglish — ingliz tilini o'rganishni yanada tizimli, amaliy va natijaga yo'naltirilgan qilish maqsadida yaratilgan ta'lim brendi. Maqsadimiz — o'quvchiga o'z imkoniyatlaridan yuqoriga chiqishga yordam berish.",
              "levelxenglish is an education brand created to make learning English more structured, practical and results-driven. Our goal is to help every learner push past their own limits.",
            ),
            t(
              "Reading, Listening, Writing va Speaking ko'nikmalari bir tizim asosida rivojlanadi: to'liq mock testlar, so'nggi imtihon savollari, maqolalar, listening practice va vocabulary.",
              "Reading, Listening, Writing and Speaking grow within one system: full mock tests, the latest exam questions, articles, listening practice and vocabulary.",
            ),
          ],
          skillsFact: t("ko'nikma — bitta tizimda", "skills — one system"),
          goalFact: t("maqsad — o'z chegarangizdan oshib o'tish", "goal — to push past your limits"),
          altitude: t("Daraja", "Level"),
        }}
      />
    </section>
  );
}

/* ============================================================================
   KIRGAN O'QUVCHI
   ============================================================================ */
async function LearnerHome({ name }: { name: string | null }) {
  const [{ continueCard, streakDays }, t] = await Promise.all([getLearnerSnapshot(), getT()]);
  const firstName = name?.trim().split(/\s+/)[0];

  return (
    <>
      {/* ------------------------------------------------------------ HERO */}
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute right-0 top-0 -z-10 h-full w-full lg:h-[520px] lg:w-[62%] opacity-30 [mask-image:linear-gradient(to_right,transparent,black_30%)]"
          aria-hidden
        >
          <Image
            src="/design/ambient-peak.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 62vw, 100vw"
            className="object-cover animate-ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
        </div>

        <div className="container-page pt-16 lg:pt-20 pb-10">
          <p className="text-lg font-medium text-muted animate-fade-up">
            {greeting(t)}
            {firstName ? `, ${firstName}` : ""} 👋
          </p>
          <h1
            className="display-title mt-6 max-w-[800px] text-5xl sm:text-6xl lg:text-[72px] font-semibold leading-[1.1] tracking-[-0.015em] text-balance-title animate-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            {t("Davom eting. Siz yorqinroq kelajakni qurayapsiz.", "Keep going. You are building a brighter future.")}
          </h1>

          <div
            className="mt-11 flex flex-col gap-6 lg:flex-row animate-fade-up"
            style={{ animationDelay: "180ms" }}
          >
            <div className="card-glass flex flex-1 flex-col gap-6 rounded-2xl p-6 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-400">
                  {continueCard
                    ? t(`Jarayonda · ${continueCard.percent}% bajarildi`, `In progress · ${continueCard.percent}% done`)
                    : t("Boshlashga tayyormisiz?", "Ready to start?")}
                </p>
                <p className="display-title truncate text-2xl">
                  {continueCard ? continueCard.title : t("Birinchi Full Mock testingizni ishlang", "Take your first Full Mock test")}
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-brand-400 transition-[width] duration-1000"
                    style={{ width: `${continueCard?.percent ?? 0}%` }}
                  />
                </div>
              </div>
              <ButtonLink href={continueCard?.href ?? "/full-mock"} className="shrink-0 px-7">
                {continueCard ? t("Davom ettirish", "Continue") : t("Boshlash", "Start")}
              </ButtonLink>
            </div>

            <div className="card-glass flex shrink-0 flex-col items-center justify-center gap-3 rounded-2xl p-6 lg:w-[280px]">
              <FlameIcon className="size-11 text-gold-400" />
              <p className="display-title text-[32px] font-semibold leading-none">
                {streakDays} {t("kun", streakDays === 1 ? "day" : "days")}
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.04em] text-faint">
                {streakDays > 0 ? t("Ketma-ket faollik", "Day streak") : t("Bugun boshlang", "Start today")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <SearchBar />
      <SkillModules />

      <section className="container-page pt-5 pb-10">
        <Reveal>
          <p className="eyebrow mb-6">
            <span className="h-px w-5 bg-brand-400" aria-hidden />
            {t("Imtihon vositalari", "Exam tools")}
          </p>
        </Reveal>
        <FeatureGrid
          glass={false}
          items={featureItems({ coursesEnabled: COURSES_ENABLED, icons: "specific" }, t)}
        />
      </section>

      <PullQuote>
        {t(
          "Cho'qqi jim qadamlar bilan zabt etiladi. Qancha qolganiga emas — qancha ko'tarilganingizga qarang.",
          "Summits are conquered with quiet steps. Look not at how far is left — but at how far you have climbed.",
        )}
      </PullQuote>

      <section className="container-page pb-10">
        <Reveal className="card-glass flex flex-col items-start justify-between gap-6 rounded-2xl p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="display-title text-3xl">{t("Natijalaringiz bir joyda", "All your results in one place")}</h2>
            <p className="mt-2 text-sm text-muted">
              {t("Ballar, CEFR darajasi, o'qituvchi izohlari va o'sish dinamikasi.", "Scores, CEFR level, teacher feedback and your progress over time.")}
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300"
          >
            {t("Shaxsiy kabinet", "My dashboard")} <ArrowRight size={16} />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
