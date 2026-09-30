import { getT } from "@/i18n/server";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/Card";

/** Maxfiylik siyosati va Foydalanish shartlari uchun umumiy ko'rinish */
export async function LegalPage({
  title,
  description,
  updated,
  children,
}: {
  title: string;
  description: string;
  updated: string;
  children: ReactNode;
}) {
  const t = await getT();
  return (
    <div className="container-page py-10 max-w-3xl">
      <PageHeader eyebrow={t("Hujjatlar", "Documents")} title={title} description={description} />
      <p className="text-xs text-muted -mt-4 mb-8">
        {t("Oxirgi yangilanish", "Last updated")}: {updated}
      </p>
      <div className="space-y-8 leading-relaxed">{children}</div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-extrabold text-lg mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-muted [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-fg">
        {children}
      </div>
    </section>
  );
}
