import { getT } from "@/i18n/server";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "react-feather";
import type { Course } from "@/lib/types";

const COURSE_IMAGES = ["/design/course-1.jpg", "/design/course-2.jpg", "/design/course-3.jpg"];

/** Figma 10: "Intensive On-Site Programs" kartasi */
export async function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const t = await getT();
  return (
    <article data-spot className="spot card lift relative flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="relative h-[180px] overflow-hidden">
        <Image
          src={course.image_url || COURSE_IMAGES[index % COURSE_IMAGES.length]}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="rounded-full border border-gold-400/70 px-2.5 py-0.5 font-semibold text-gold-400">
            {course.level ?? "Multilevel"}
          </span>
          {course.duration ? <span className="text-muted">{course.duration}</span> : null}
        </div>
        <h3 className="display-title mt-4 text-[24px] leading-snug">{course.title}</h3>
        {course.summary ? (
          <p className="mt-2 text-[13px] leading-relaxed text-muted line-clamp-3">{course.summary}</p>
        ) : null}

        <div className="mt-4 flex-1 space-y-1.5 text-xs text-muted">
          {course.days || course.time_text ? (
            <p className="flex items-center gap-2">
              <Calendar size={13} className="shrink-0 text-brand-400" aria-hidden />
              {[course.days, course.time_text].filter(Boolean).join(" | ")}
            </p>
          ) : null}
          {course.address ? (
            <p className="flex items-center gap-2">
              <MapPin size={13} className="shrink-0 text-brand-400" aria-hidden />
              <span className="truncate">{course.address}</span>
            </p>
          ) : null}
        </div>

        <p className="mt-4 text-[15px] font-semibold text-fg">{course.price ?? t("Narx kelishiladi", "Price on request")}</p>

        <Link
          href={`/courses/${course.slug}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full border-[1.5px] border-brand-400 px-6 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-brand-400 hover:text-ink-950"
        >
          {t("Kursga yozilish", "Enrol")}
        </Link>
      </div>
    </article>
  );
}
