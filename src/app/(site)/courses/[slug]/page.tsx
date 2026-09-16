import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getCourseBySlug } from "@/lib/queries";
import { getContactSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CourseApplyForm } from "@/components/forms/CourseApplyForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  return {
    title: course?.title ?? "Kurs",
    description: course?.summary ?? undefined,
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [course, profile, contact] = await Promise.all([
    getCourseBySlug(slug),
    getProfile(),
    getContactSettings(),
  ]);

  if (!course || !course.published) notFound();

  const details = [
    { label: "Davomiyligi", value: course.duration, icon: "📅" },
    { label: "Dars kunlari", value: course.days, icon: "🗓️" },
    { label: "Vaqti", value: course.time_text, icon: "⏰" },
    { label: "Narxi", value: course.price, icon: "💳" },
    { label: "Manzil", value: course.address ?? contact.address, icon: "📍" },
    {
      label: "Guruhdagi o'quvchilar",
      value: course.seats ? `${course.seats} nafargacha` : null,
      icon: "👥",
    },
  ].filter((d) => d.value);

  return (
    <div className="container-page py-10">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6"
      >
        ← Barcha kurslar
      </Link>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div>
          <PageHeader
            eyebrow="Offline kurs"
            title={course.title}
            description={course.summary ?? undefined}
          >
            {course.level ? <Badge tone="brand">{course.level}</Badge> : null}
          </PageHeader>

          <div className="grid sm:grid-cols-2 gap-3">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="card p-4 flex items-start gap-3"
              >
                <span className="text-xl shrink-0" aria-hidden>
                  {detail.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {detail.label}
                  </p>
                  <p className="font-bold mt-0.5 break-words">{detail.value}</p>
                </div>
              </div>
            ))}
          </div>

          {course.description ? (
            <div className="card p-6 mt-6">
              <h2 className="font-extrabold text-lg mb-3">Kurs haqida</h2>
              <p className="leading-relaxed whitespace-pre-line text-[15px]">
                {course.description}
              </p>
            </div>
          ) : null}

          <div className="card p-6 mt-6">
            <h2 className="font-extrabold text-lg mb-3">
              Kursda nimalar bo&apos;ladi?
            </h2>
            <ul className="space-y-2.5 text-sm">
              {[
                "Har darsda to'rt ko'nikma: Reading, Listening, Writing, Speaking",
                "Har hafta mini-test, har oyda to'liq mock test",
                "Yozma ishlar o'qituvchi tomonidan tekshiriladi",
                "Platformadagi barcha onlayn materiallarga kirish",
                "Imtihonga qadar individual maslahat",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="text-emerald-500 shrink-0" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* --------------------------------------------- Ariza formasi */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="card p-6">
            <h2 className="font-extrabold text-lg">Kursga yozilish</h2>
            <p className="text-sm text-muted mt-1.5 mb-5">
              Ma&apos;lumotlaringizni qoldiring — administrator siz bilan
              bog&apos;lanadi.
            </p>

            <CourseApplyForm
              courseId={course.id}
              courseTitle={course.title}
              defaultName={profile?.full_name}
              defaultPhone={profile?.phone}
            />
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-sm mb-3">Tezroq bog&apos;lanish</h3>
            <div className="space-y-2">
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2.5 rounded-xl border border-line
                           bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold
                           hover:border-brand-400 transition-colors"
              >
                📞 {contact.phone}
              </a>
              <a
                href={contact.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-line
                           bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm font-semibold
                           hover:border-brand-400 transition-colors"
              >
                ✈️ {contact.telegram_label}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
