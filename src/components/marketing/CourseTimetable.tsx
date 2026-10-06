import Link from "next/link";
import { ArrowUpRight, Clock } from "react-feather";
import { getT } from "@/i18n/server";
import type { Course } from "@/lib/types";

/**
 * Haftalik dars jadvali — kurslar "dars kunlari" bo'yicha ustunlarga bo'linadi
 * (masalan, Dushanba · Chorshanba · Juma va Seshanba · Payshanba · Shanba),
 * har ustunda guruhlar vaqt tartibida. Ma'lumot to'liq admin paneldagi kurslardan olinadi.
 */
export async function CourseTimetable({ courses }: { courses: Course[] }) {
  const t = await getT();
  const groups = new Map<string, Course[]>();
  for (const course of courses) {
    const days = course.days?.trim();
    if (!days) continue;
    groups.set(days, [...(groups.get(days) ?? []), course]);
  }
  if (groups.size === 0) return null;

  const columns = [...groups.entries()].map(([days, list]) => ({
    days,
    list: [...list].sort((a, b) => (a.time_text ?? "").localeCompare(b.time_text ?? "")),
  }));

  return (
    <div className="ctt">
      <div className="ctt-head">
        <div>
          <p className="ctt-eyebrow">{t("Dars jadvali", "Timetable")}</p>
          <h2 className="display-title text-[28px] sm:text-[34px]">{t("Haftalik guruhlar", "Weekly groups")}</h2>
        </div>
        <p className="ctt-note">
          <Clock size={14} aria-hidden />
          {t("Darslar 2 soatdan + 1 soat support teacher bilan", "2-hour lessons + 1 hour with a support teacher")}
        </p>
      </div>

      <div className="ctt-cols" style={{ ["--cols" as string]: columns.length }}>
        {columns.map((col) => (
          <div key={col.days} className="ctt-col">
            <p className="ctt-days">{col.days}</p>
            <ul>
              {col.list.map((course) => (
                <li key={course.id}>
                  <Link href={`/courses/${course.slug}`} className="ctt-slot">
                    <span className="ctt-time">{course.time_text?.split(/\s*[–-]\s*/)[0] ?? ""}</span>
                    <span className="min-w-0 flex-1">
                      <span className="ctt-level">{course.level ?? course.title}</span>
                      <span className="ctt-title">{course.title}</span>
                    </span>
                    {course.price ? <span className="ctt-price">{course.price}</span> : null}
                    <ArrowUpRight size={15} className="ctt-arrow" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
