import type { Metadata } from "next";
import Link from "next/link";
import { listAllCourses } from "@/lib/admin-queries";
import { upsertCourseAction, deleteCourseAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Card";
import { AdminForm } from "@/components/admin/AdminForm";
import { Collapsible } from "@/components/admin/Collapsible";
import { courseFields } from "@/components/admin/fieldSpecs";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export const metadata: Metadata = {
  title: "Kurslar",
  robots: { index: false, follow: false },
};

export default async function AdminCoursesPage() {
  const courses = await listAllCourses();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold">Offline kurslar</h2>
        <p className="text-sm text-muted mt-0.5">
          Saytdagi &quot;Offline Courses&quot; bo&apos;limi
        </p>
      </div>

      <Collapsible
        title="➕ Yangi kurs qo'shish"
        subtitle="Dars kunlari, vaqti, narxi va manzil"
        tone="accent"
      >
        <AdminForm
          action={upsertCourseAction}
          fields={courseFields()}
          submitLabel="Kursni yaratish"
          resetOnSuccess
        />
      </Collapsible>

      {courses.length === 0 ? (
        <EmptyState
          icon="🏫"
          title="Kurslar yo'q"
          description="Yuqoridagi forma orqali birinchi kursni qo'shing."
        />
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <Collapsible
              key={course.id}
              title={course.title}
              subtitle={`${course.level ?? ""} · ${course.days ?? "—"} · ${course.price ?? "—"}${
                course.published ? "" : " · YASHIRIN"
              }`}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {course.level ? (
                    <Badge tone="brand">{course.level}</Badge>
                  ) : null}
                  {!course.published ? (
                    <Badge tone="warning">Yashirin</Badge>
                  ) : null}
                  <Link
                    href={`/courses/${course.slug}`}
                    className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    👁 Saytda ko&apos;rish
                  </Link>
                </div>

                <AdminForm
                  action={upsertCourseAction}
                  fields={courseFields(
                    course as unknown as Record<string, unknown>,
                  )}
                  submitLabel="Kursni saqlash"
                />

                <form
                  action={deleteCourseAction}
                  className="pt-3 border-t border-line"
                >
                  <input type="hidden" name="id" value={course.id} />
                  <ConfirmSubmitButton
                    message="Bu kursni o'chirasizmi? Unga kelgan barcha arizalar ham o'chadi."
                    className="text-sm font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    🗑 Bu kursni o&apos;chirish
                  </ConfirmSubmitButton>
                </form>
              </div>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
