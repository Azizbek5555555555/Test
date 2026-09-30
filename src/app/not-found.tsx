import Link from "next/link";
import { BrandMark, BrandWordmark } from "@/components/layout/BrandLogo";
import { ButtonLink } from "@/components/ui/Button";
import { getT } from "@/i18n/server";

/** 404 — Figma uslubida: tog' fonida xabar va asosiy yo'nalishlar */
export default async function NotFound() {
  const t = await getT();
  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-ink-950">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[url('/design/summit-hut.jpg')] bg-cover bg-center opacity-20 animate-ken-burns"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/30 via-ink-950/70 to-ink-950" />

      <div className="container-page py-8">
        <Link href="/" className="flex w-fit items-center gap-3" aria-label={t("LevelX English — bosh sahifa", "LevelX English — home")}>
          <BrandMark size={32} />
          <BrandWordmark className="text-2xl" />
        </Link>
      </div>

      <div className="container-page flex flex-1 flex-col justify-center pb-24">
        <p className="eyebrow animate-fade-up">
          <span className="h-px w-6 bg-brand-400" aria-hidden />
          404 · {t("Sahifa topilmadi", "Page not found")}
        </p>
        <h1 className="display-title mt-5 max-w-2xl text-[44px] leading-[1.08] sm:text-[64px] animate-fade-up">
          {t("Bu yo'l cho'qqiga olib bormaydi", "This path doesn't lead to the summit")}
        </h1>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted animate-fade-up">
          {t(
            "Siz qidirgan sahifa o'chirilgan, ko'chirilgan yoki manzil noto'g'ri yozilgan. Quyidagi yo'nalishlardan birini tanlang.",
            "The page you are looking for was removed, moved, or the address is mistyped. Choose one of the routes below.",
          )}
        </p>
        <div className="mt-8 flex flex-wrap gap-3 animate-fade-up">
          <ButtonLink href="/" size="lg">
            {t("Bosh sahifa", "Home")}
          </ButtonLink>
          <ButtonLink href="/full-mock" variant="secondary" size="lg">
            {t("Full Mock testlar", "Full Mock tests")}
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
