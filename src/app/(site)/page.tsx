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
import { Caveat } from "next/font/google";
import { HomeStory } from "@/components/story/HomeStory";
import { AmbientBackdrop } from "@/components/story/AmbientBackdrop";
import { Spotlight } from "@/components/story/Spotlight";
import { ResultReveal } from "@/components/story/ResultReveal";
import { StatsReveal } from "@/components/home/StatsReveal";
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

// Qo'lyozma shrifti — hero shiori, suzuvchi so'zlar va natija varaqalaridagi yozuvlar uchun
const hand = Caveat({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-hand",
});

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
  const [stats, courses] = await Promise.all([
    getSiteStats(),
    COURSES_ENABLED ? getCourses() : Promise.resolve([]),
  ]);

  return (
    <>
      <Spotlight />
      <div className={hand.variable}>
      <HomeStory stats={stats} handFontClass={hand.variable} />
      <AmbientBackdrop>

      <StatsReveal
        eyebrow="Platforma raqamlarda"
        items={[
          { value: stats.fullMocks, label: "Full Mock test", icon: "mock" },
          { value: stats.listeningSets, label: "Listening mashqi", icon: "listening" },
          { value: stats.articles, label: "Maqola", icon: "article" },
          { value: stats.questions, label: "Savollar bazasi", icon: "question" },
        ]}
      />

      {/* 3D natija varaqasi + oltin chiziqlar */}
      <ResultReveal />

      {/* ------------------------------------------------------- VOSITALAR */}
      <section className="container-page py-20">
        <SectionTitle eyebrow="Platforma imkoniyatlari" title="Cho'qqiga chiqish uchun vositalar" />
        <FeatureGrid items={featureItems({ coursesEnabled: COURSES_ENABLED, icons: "stars" })} />
      </section>

      <CompareTable />

      <PullQuote>Davom eting. Siz yorqinroq kelajakni qurayapsiz.</PullQuote>

      <Roadmap />

      {/* --------------------------------------------------------- HAQIMIZDA */}
      <AboutSection />

      {COURSES_ENABLED ? <CoursesStrip courses={courses} /> : null}
      </AmbientBackdrop>
      </div>
    </>
  );
}

function AboutSection() {
  return (
    <section className="container-page py-20" id="about">
      <Reveal className="card-glass grid overflow-hidden lg:grid-cols-[1fr_1.1fr]">
        <div className="relative min-h-[280px] lg:min-h-full">
          <Image
            src="/design/ambient-peak.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent lg:bg-gradient-to-r" />
          <div className="absolute bottom-8 left-8 right-8">
            <p className="font-display italic text-2xl sm:text-[28px] leading-snug text-brand-300">
              “Har bir qadam cho&apos;qqi sari puxta chizilgan.”
            </p>
          </div>
        </div>
        <div className="p-8 sm:p-12">
          <p className="eyebrow">
            <span className="h-px w-5 bg-brand-400" aria-hidden />
            Biz haqimizda
          </p>
          <h2 className="display-title mt-4 text-4xl sm:text-[44px]">LevelX English</h2>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted">
            <p>
              LevelX English — ingliz tilini o&apos;rganishni yanada tizimli, amaliy va
              natijaga yo&apos;naltirilgan qilish maqsadida yaratilgan ta&apos;lim brendi.
              Maqsadimiz — o&apos;quvchiga o&apos;z imkoniyatlaridan yuqoriga chiqishga
              yordam berish.
            </p>
            <p>
              Reading, Listening, Writing va Speaking ko&apos;nikmalari bir tizim asosida
              rivojlanadi: to&apos;liq mock testlar, so&apos;nggi imtihon savollari,
              maqolalar, listening practice va vocabulary.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-8">
            <div>
              <p className="font-display text-5xl font-semibold text-brand-400">4</p>
              <p className="mt-1 text-sm text-muted">ko&apos;nikma — bitta tizimda</p>
            </div>
            <div>
              <p className="font-display text-5xl font-semibold text-gold-400">1</p>
              <p className="mt-1 text-sm text-muted">maqsad — {SITE_TAGLINE}</p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================================================================
   KIRGAN O'QUVCHI
   ============================================================================ */
async function LearnerHome({ name }: { name: string | null }) {
  const { continueCard, streakDays } = await getLearnerSnapshot();
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
            {greeting()}
            {firstName ? `, ${firstName}` : ""} 👋
          </p>
          <h1
            className="display-title mt-6 max-w-[800px] text-5xl sm:text-6xl lg:text-[72px] font-semibold leading-[1.1] tracking-[-0.015em] text-balance-title animate-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            Davom eting. Siz yorqinroq kelajakni qurayapsiz.
          </h1>

          <div
            className="mt-11 flex flex-col gap-6 lg:flex-row animate-fade-up"
            style={{ animationDelay: "180ms" }}
          >
            <div className="card-glass flex flex-1 flex-col gap-6 rounded-2xl p-6 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-400">
                  {continueCard
                    ? `Jarayonda · ${continueCard.percent}% bajarildi`
                    : "Boshlashga tayyormisiz?"}
                </p>
                <p className="display-title truncate text-2xl">
                  {continueCard ? continueCard.title : "Birinchi Full Mock testingizni ishlang"}
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-brand-400 transition-[width] duration-1000"
                    style={{ width: `${continueCard?.percent ?? 0}%` }}
                  />
                </div>
              </div>
              <ButtonLink href={continueCard?.href ?? "/full-mock"} className="shrink-0 px-7">
                {continueCard ? "Davom ettirish" : "Boshlash"}
              </ButtonLink>
            </div>

            <div className="card-glass flex shrink-0 flex-col items-center justify-center gap-3 rounded-2xl p-6 lg:w-[280px]">
              <FlameIcon className="size-11 text-gold-400" />
              <p className="display-title text-[32px] font-semibold leading-none">
                {streakDays} kun
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.04em] text-faint">
                {streakDays > 0 ? "Ketma-ket faollik" : "Bugun boshlang"}
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
            Imtihon vositalari
          </p>
        </Reveal>
        <FeatureGrid
          glass={false}
          items={featureItems({ coursesEnabled: COURSES_ENABLED, icons: "specific" })}
        />
      </section>

      <PullQuote>
        Cho&apos;qqi jim qadamlar bilan zabt etiladi. Qancha qolganiga emas — qancha
        ko&apos;tarilganingizga qarang.
      </PullQuote>

      <section className="container-page pb-10">
        <Reveal className="card-glass flex flex-col items-start justify-between gap-6 rounded-2xl p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="display-title text-3xl">Natijalaringiz bir joyda</h2>
            <p className="mt-2 text-sm text-muted">
              Ballar, CEFR darajasi, o&apos;qituvchi izohlari va o&apos;sish dinamikasi.
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300"
          >
            Shaxsiy kabinet <ArrowRight size={16} />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
