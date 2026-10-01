import { getProfile } from "@/lib/auth";
import { getCourses } from "@/lib/queries";
import { getSiteStats, greeting } from "@/lib/home";
import { getLearnerHome } from "@/lib/learner-home";
import { getCefrBands } from "@/lib/settings";
import type { Profile } from "@/lib/types";
import { LearnerHero } from "@/components/learner/LearnerHero";
import { LearnerPanels } from "@/components/learner/LearnerPanels";
import { COURSES_ENABLED, SITE_TAGLINE } from "@/lib/constants";
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
  SectionTitle,
  featureItems,
} from "@/components/home/Sections";

/**
 * Bosh sahifa — Figma: 01-homepage-before-login va 03-homepage-after-login.
 */
export default async function HomePage() {
  const profile = await getProfile();
  return profile ? <LearnerHome profile={profile} /> : <GuestHome />;
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
   KIRGAN O'QUVCHI — shaxsiy "oyna" + natijalar, kalendar, bugungi reja
   ============================================================================ */
async function LearnerHome({ profile }: { profile: Profile }) {
  const [data, bands, t] = await Promise.all([getLearnerHome(profile.id), getCefrBands(), getT()]);
  const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? null;

  return (
    <>
      <LearnerHero
        firstName={firstName}
        avatarUrl={profile.avatar_url}
        greeting={greeting(t)}
        level={data.level}
        overall={data.overall}
        streak={data.streak}
        bestStreak={data.bestStreak}
        calendars={data.calendars}
        next={data.next}
        skills={data.skills}
      />
      <LearnerPanels data={data} bands={bands} />
    </>
  );
}
