"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

/** Kutilmagan xatolik sahifasi (sahifa ichida xato bo'lsa) */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <main className="flex min-h-[70dvh] items-center bg-ink-950">
      <div className="container-page py-20">
        <p className="eyebrow">
          <span className="h-px w-6 bg-brand-400" aria-hidden />
          {t("Xatolik", "Error")}
        </p>
        <h1 className="display-title mt-5 max-w-2xl text-[40px] leading-tight sm:text-[56px]">
          {t("Nimadir noto'g'ri ketdi", "Something went wrong")}
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
          {t(
            "Sahifani yuklashda kutilmagan xatolik yuz berdi. Qayta urinib ko'ring — muammo takrorlansa, biz bilan bog'laning.",
            "An unexpected error occurred while loading the page. Please try again — if the problem continues, contact us.",
          )}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={() => reset()}>
            {t("Qayta urinish", "Try again")}
          </Button>
          <Link href="/" className="text-sm font-semibold text-brand-400 hover:text-brand-300">
            {t("Bosh sahifaga", "Back to home")} →
          </Link>
        </div>
      </div>
    </main>
  );
}
