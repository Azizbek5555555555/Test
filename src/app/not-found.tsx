import Link from "next/link";
import { BrandMark, BrandWordmark } from "@/components/layout/BrandLogo";
import { ButtonLink } from "@/components/ui/Button";

/** 404 — Figma uslubida: tog' fonida xabar va asosiy yo'nalishlar */
export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-ink-950">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[url('/design/summit-hut.jpg')] bg-cover bg-center opacity-20 animate-ken-burns"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/30 via-ink-950/70 to-ink-950" />

      <div className="container-page py-8">
        <Link href="/" className="flex w-fit items-center gap-3" aria-label="LevelX English — bosh sahifa">
          <BrandMark size={32} />
          <BrandWordmark className="text-2xl" />
        </Link>
      </div>

      <div className="container-page flex flex-1 flex-col justify-center pb-24">
        <p className="eyebrow animate-fade-up">
          <span className="h-px w-6 bg-brand-400" aria-hidden />
          404 · Sahifa topilmadi
        </p>
        <h1 className="display-title mt-5 max-w-2xl text-[44px] leading-[1.08] sm:text-[64px] animate-fade-up">
          Bu yo&apos;l cho&apos;qqiga olib bormaydi
        </h1>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted animate-fade-up">
          Siz qidirgan sahifa o&apos;chirilgan, ko&apos;chirilgan yoki manzil noto&apos;g&apos;ri yozilgan.
          Quyidagi yo&apos;nalishlardan birini tanlang.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 animate-fade-up">
          <ButtonLink href="/" size="lg">
            Bosh sahifa
          </ButtonLink>
          <ButtonLink href="/full-mock" variant="secondary" size="lg">
            Full Mock testlar
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
