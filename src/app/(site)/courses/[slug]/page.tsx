import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COURSES_ENABLED } from "@/lib/constants";
import { getProfile } from "@/lib/auth";
import { getCourseBySlug } from "@/lib/queries";
import { getContactSettings } from "@/lib/settings";
import Image from "next/image";
import { Calendar, Check, Clock, CreditCard, MapPin, Phone, Send, Users } from "react-feather";
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
  // Kurslar bo'limi o'chirilgan bo'lsa (constants.ts → COURSES_ENABLED)
  if (!COURSES_ENABLED) notFound();
  const { slug } = await params;

  const [course, profile, contact] = await Promise.all([
    getCourseBySlug(slug),
    getProfile(),
    getContactSettings(),
  ]);

  if (!course || !course.published) notFound();

  const details = [
    { label: "Davomiyligi", value: course.duration, icon: Clock },
    { label: "Dars kunlari", value: course.days, icon: Calendar },
    { label: "Vaqti", value: course.time_text, icon: Clock },
    { label: "Narxi", value: course.price, icon: CreditCard },
    { label: "Manzil", value: course.address ?? contact.address, icon: MapPin },
    {
      label: "Guruhdagi o'quvchilar",
      value: course.seats ? `${course.seats} nafargacha` : null,
      icon: Users,
    },
  ].filter((d) => d.value);

  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <Image
          src={course.image_url || "/design/course-1.jpg"}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-25"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/40 via-ink-950/80 to-ink-950" />
        <div className="container-page pb-12 pt-10 sm:pt-14">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"
          >
            ← Barcha kurslar
          </Link>
          <div className="ph-copy mt-8 max-w-2xl">
            <p className="hero-pill">
              <i aria-hidden />
              Offline kurs
            </p>
            <h1 className="display-title mt-5 text-[40px] sm:text-[52px]">{course.title}</h1>
            <p className="hero-hand">Face to face with your teacher</p>
            {course.level ? (
              <span className="mt-4 inline-flex w-fit rounded-full border border-gold-400/70 px-3 py-0.5 text-xs font-semibold text-gold-400">
                {course.level}
              </span>
            ) : null}
            {course.summary ? (
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{course.summary}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="container-page grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {details.map((detail) => (
              <div key={detail.label} className="card flex items-start gap-3 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-ink-800 text-brand-400">
                  <detail.icon size={16} strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {detail.label}
                  </p>
                  <p className="mt-0.5 break-words font-semibold text-fg">{detail.value}</p>
                </div>
              </div>
            ))}
          </div>

          {course.description ? (
            <div className="card rounded-2xl p-6 sm:p-8">
              <h2 className="display-title text-2xl">Kurs haqida</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-200">
                {course.description}
              </p>
            </div>
          ) : null}

          <div className="card rounded-2xl p-6 sm:p-8">
            <h2 className="display-title text-2xl">Kursda nimalar bo&apos;ladi?</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                "Har darsda to'rt ko'nikma: Reading, Listening, Writing, Speaking",
                "Har hafta mini-test, har oyda to'liq mock test",
                "Yozma ishlar o'qituvchi tomonidan tekshiriladi",
                "Platformadagi barcha onlayn materiallarga kirish",
                "Imtihonga qadar individual maslahat",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-fg">
                  <Check size={15} className="mt-0.5 shrink-0 text-success" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* --------------------------------------------- Ariza formasi */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-line bg-ink-800 p-6 sm:p-7">
            <p className="display-title text-[26px]">Kursga yozilish</p>
            <p className="mb-5 mt-1.5 text-sm text-muted">
              Ma&apos;lumotlaringizni qoldiring — administrator siz bilan bog&apos;lanadi.
            </p>

            <CourseApplyForm
              courseId={course.id}
              courseTitle={course.title}
              defaultName={profile?.full_name}
              defaultPhone={profile?.phone}
            />
          </div>

          <div className="card-glass rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Tezroq bog&apos;lanish</p>
            <div className="mt-3 space-y-2">
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2.5 rounded-full border border-line px-4 py-2.5 text-sm font-semibold transition-colors hover:border-brand-400"
              >
                <Phone size={14} className="text-brand-400" aria-hidden /> {contact.phone}
              </a>
              <a
                href={contact.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-full border border-line px-4 py-2.5 text-sm font-semibold transition-colors hover:border-brand-400"
              >
                <Send size={14} className="text-brand-400" aria-hidden /> {contact.telegram_label}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
