import type { Metadata } from "next";
import Link from "next/link";
import { getCourses } from "@/lib/queries";
import { getContactSettings } from "@/lib/settings";
import { PageHeader, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Offline kurslar",
  description:
    "Multilevel B1, B2 va Intensive tayyorlov kurslari — dars kunlari, vaqti, narxi va manzili.",
};

export default async function CoursesPage() {
  const [courses, contact] = await Promise.all([
    getCourses(),
    getContactSettings(),
  ]);

  return (
    <div className="container-page py-10">
      <PageHeader
        eyebrow="Offline"
        title="Offline kurslar"
        description="Multilevel tayyorlov kurslarimizga qo'shiling. Har bir kurs sahifasida dars kunlari, vaqti, narxi va manzil ko'rsatilgan."
      />

      {courses.length === 0 ? (
        <EmptyState
          icon="🏫"
          title="Kurslar hali qo'shilmagan"
          description="Admin panel orqali kurslarni qo'shishingiz mumkin."
          action={<ButtonLink href="/contact">Biz bilan bog&apos;lanish</ButtonLink>}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="group card p-0 overflow-hidden flex flex-col
                         hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className="h-1.5 bg-gradient-to-r from-brand-500 to-brand-700"
                aria-hidden
              />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold text-lg leading-snug">
                    {course.title}
                  </h2>
                  {course.level ? (
                    <Badge tone="brand">{course.level}</Badge>
                  ) : null}
                </div>

                {course.summary ? (
                  <p className="text-sm text-muted mt-2 leading-relaxed flex-1">
                    {course.summary}
                  </p>
                ) : null}

                <dl className="mt-4 space-y-1.5 text-sm">
                  {course.duration ? (
                    <Row label="Davomiyligi" value={course.duration} />
                  ) : null}
                  {course.days ? <Row label="Dars kunlari" value={course.days} /> : null}
                  {course.time_text ? (
                    <Row label="Vaqti" value={course.time_text} />
                  ) : null}
                </dl>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
                  <span className="font-extrabold text-brand-600 dark:text-brand-400">
                    {course.price ?? "Narx kelishiladi"}
                  </span>
                  <span
                    className="text-sm font-bold text-muted group-hover:text-fg
                               group-hover:translate-x-0.5 transition-all"
                  >
                    LEARN MORE →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="card p-6 mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-lg">
              {contact.address ? "Manzil" : "Bog'lanish"}
            </h2>
            {contact.address ? (
              <p className="text-sm text-muted mt-1.5">{contact.address}</p>
            ) : null}
            {contact.working_hours ? (
              <p className="text-sm text-muted">{contact.working_hours}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <a
              href={`tel:${contact.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 rounded-xl border border-line
                         bg-[var(--bg-subtle)] px-4 py-2.5 text-sm font-semibold
                         hover:border-brand-400 transition-colors"
            >
              📞 {contact.phone}
            </a>
            <a
              href={contact.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-line
                         bg-[var(--bg-subtle)] px-4 py-2.5 text-sm font-semibold
                         hover:border-brand-400 transition-colors"
            >
              ✈️ Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd className="font-semibold text-right">{value}</dd>
    </div>
  );
}
