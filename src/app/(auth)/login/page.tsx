import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import { BrandMark, BrandWordmark } from "@/components/layout/BrandLogo";

export const metadata: Metadata = {
  title: "Kirish",
  description:
    "LevelX English platformasiga Google orqali kiring va tayyorgarlikni boshlang.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const rawNext = params.next ?? "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const user = await getUser();
  if (user) redirect(next);

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* ------------------------------------------------ Chap panel: "The summit concept" */}
      <aside className="relative isolate flex flex-col overflow-hidden bg-gradient-to-b from-[#212d44] via-[#121b2c] via-55% to-[#0b1220] px-6 pb-10 pt-8 sm:px-10 lg:w-[44.5%] lg:max-w-[640px] lg:shrink-0 lg:px-[60px] lg:py-[60px]">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[url('/design/summit-hut.jpg')] bg-cover bg-center opacity-30 animate-ken-burns"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-ink-950/80 to-transparent" />

        <Link href="/" className="flex w-fit items-center gap-3" aria-label="LevelX English — bosh sahifa">
          <BrandMark size={32} />
          <BrandWordmark className="text-2xl" />
        </Link>

        <div className="mt-10 sm:mt-14 lg:mt-auto">
          <p className="eyebrow animate-fade-up">
            <span className="h-px w-6 bg-brand-400" aria-hidden />
            The summit concept
          </p>
          <h1 className="display-title mt-4 text-[36px] leading-[1.1] sm:mt-5 sm:text-[48px] lg:text-[56px] animate-fade-up">
            Cho&apos;qqiga yo&apos;l
            <br />
            shu yerdan boshlanadi
          </h1>
          <p className="mt-4 font-display text-xl italic sm:mt-6 text-brand-400 sm:text-2xl animate-fade-up">
            “Har kungi kichik qadamlar — katta natijalar”
          </p>
        </div>

        <div className="mt-10 hidden items-center gap-4 sm:flex lg:mt-auto">
          <div className="flex -space-x-2" aria-hidden>
            {["A", "M", "S"].map((ch) => (
              <span
                key={ch}
                className="grid size-8 place-items-center rounded-full border border-brand-400/60 bg-ink-900 font-display text-sm text-fg"
              >
                {ch}
              </span>
            ))}
          </div>
          <p className="text-[13px] text-muted">
            O&apos;quvchilar bilan birga <span className="font-semibold text-fg">B1, B2 va C1</span> cho&apos;qqilariga ko&apos;tariling.
          </p>
        </div>
      </aside>

      {/* ------------------------------------------------ O'ng panel: forma */}
      <section className="flex flex-1 items-start justify-center border-line bg-ink-950 px-6 py-12 sm:px-10 lg:items-center lg:border-l lg:py-[60px]">
        <div className="w-full max-w-[400px] animate-fade-up">
          <LoginForm
            next={next}
            initialError={params.error}
            emailEnabled={process.env.EMAIL_LOGIN === "on"}
          />
        </div>
      </section>
    </div>
  );
}
