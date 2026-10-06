import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getCourses } from "@/lib/queries";
import { getContactSettings } from "@/lib/settings";
import { COURSES_ENABLED } from "@/lib/constants";
import { EmptyState } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/marketing/PageHero";
import { CourseCard } from "@/components/marketing/CourseCard";
import { CourseTimetable } from "@/components/marketing/CourseTimetable";
import { ContactSection } from "@/components/marketing/ContactSection";
import { Reveal } from "@/components/motion/Reveal";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Offline kurslar", "Offline courses"),
    description: t(
      "A1 dan B2 gacha guruhlar, CEFR / Multilevel va IELTS tayyorlov kurslari — dars kunlari, vaqti, narxi va manzili.",
      "Groups from A1 to B2, CEFR / Multilevel and IELTS preparation — class days, times, prices and address.",
    ),
  };
}

export default async function CoursesPage() {
  // Kurslar bo'limi o'chirilgan bo'lsa (constants.ts → COURSES_ENABLED)
  if (!COURSES_ENABLED) notFound();

  const [courses, contact, profile, t] = await Promise.all([
    getCourses(),
    getContactSettings(),
    getProfile(),
    getT(),
  ]);

  return (
    <div>
      <PageHero
        eyebrow={t("Offline mashg'ulotlar", "Offline classes")}
        title={t("Intensiv kurslar", "Intensive courses")}
        highlight={t("Intensiv", "Intensive")}
        hand="Face to face with your teacher"
        words={["small groups", "speaking", "B2 → C1", "feedback"]}
      >
        {t(
          "Multilevel tayyorlov kurslarimizga qo'shiling. Har bir kurs sahifasida dars kunlari, vaqti, narxi va manzil ko'rsatilgan.",
          "Join our Multilevel preparation courses. Each course page shows class days, times, price and address.",
        )}
      </PageHero>

      <section className="container-page">
        {courses.length === 0 ? (
          <EmptyState
            icon="🏫"
            title={t("Kurslar hali qo'shilmagan", "No courses yet")}
            description={t("Tez orada yangi kurslar qo'shiladi.", "New courses are coming soon.")}
            action={<ButtonLink href="/contact">{t("Biz bilan bog'lanish", "Contact us")}</ButtonLink>}
          />
        ) : (
          <>
            <Reveal className="mb-10">
              <CourseTimetable courses={courses} />
            </Reveal>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, i) => (
                <Reveal key={course.id} delay={(i % 3) * 80}>
                  <CourseCard course={course} index={i} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="container-page mt-20 border-t border-line pt-20">
        <ContactSection
          contact={contact}
          defaults={{ name: profile?.full_name, email: profile?.email, phone: profile?.phone }}
        />
      </section>
    </div>
  );
}
