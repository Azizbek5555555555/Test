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
import { ContactSection } from "@/components/marketing/ContactSection";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Offline kurslar",
  description:
    "Multilevel B1, B2 va Intensive tayyorlov kurslari — dars kunlari, vaqti, narxi va manzili.",
};

export default async function CoursesPage() {
  // Kurslar bo'limi o'chirilgan bo'lsa (constants.ts → COURSES_ENABLED)
  if (!COURSES_ENABLED) notFound();

  const [courses, contact, profile] = await Promise.all([
    getCourses(),
    getContactSettings(),
    getProfile(),
  ]);

  return (
    <div>
      <PageHero
        eyebrow="Offline mashg'ulotlar"
        title="Intensiv kurslar"
        highlight="Intensiv"
        hand="Face to face with your teacher"
        words={["small groups", "speaking", "B2 → C1", "feedback"]}
      >
        Multilevel tayyorlov kurslarimizga qo&apos;shiling. Har bir kurs sahifasida dars kunlari,
        vaqti, narxi va manzil ko&apos;rsatilgan.
      </PageHero>

      <section className="container-page">
        {courses.length === 0 ? (
          <EmptyState
            icon="🏫"
            title="Kurslar hali qo'shilmagan"
            description="Admin panel orqali kurslarni qo'shishingiz mumkin."
            action={<ButtonLink href="/contact">Biz bilan bog&apos;lanish</ButtonLink>}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, i) => (
              <Reveal key={course.id} delay={(i % 3) * 80}>
                <CourseCard course={course} index={i} />
              </Reveal>
            ))}
          </div>
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
