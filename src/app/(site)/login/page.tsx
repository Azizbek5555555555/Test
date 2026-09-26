import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Kirish",
  description:
    "Multilevel Plus platformasiga Google yoki email orqali kiring va tayyorgarlikni boshlang.",
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

  const benefits = [
    { icon: "📝", text: "Full Mock testlar va real imtihon simulyatsiyasi" },
    { icon: "📚", text: "Oxirgi yillarda tushgan savollar to'plami" },
    { icon: "🎮", text: "Vocabulary Battle va haftalik reyting" },
    { icon: "📊", text: "Barcha natijalar profilingizda saqlanadi" },
  ];

  return (
    <div className="container-page py-10 sm:py-16">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-5xl mx-auto">
        {/* Chap tomon — tanishtiruv */}
        <div className="hidden lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400 mb-3">
            Learn · Practice · Take Exam · Improve
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-balance-title">
            Multilevel imtihoniga <br />
            <span className="text-brand-600">tizimli</span> tayyorgarlik
          </h1>
          <p className="text-muted mt-4 leading-relaxed">
            Bir marta ro&apos;yxatdan o&apos;ting — barcha testlar, natijalar va
            progress bitta joyda saqlanadi.
          </p>

          <ul className="mt-8 space-y-3.5">
            {benefits.map((b) => (
              <li key={b.text} className="flex items-start gap-3">
                <span className="text-xl shrink-0" aria-hidden>
                  {b.icon}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* O'ng tomon — forma */}
        <div className="card p-6 sm:p-8 w-full max-w-md mx-auto lg:mx-0">
          <div className="text-center mb-7">
            <span
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700
                         text-white grid place-items-center font-extrabold mx-auto mb-4 shadow-sm"
              aria-hidden
            >
              M+
            </span>
            <h2 className="text-2xl font-extrabold">Xush kelibsiz</h2>
            <p className="text-sm text-muted mt-1.5">
              Kirish va ro&apos;yxatdan o&apos;tish bir xil — hisobingiz
              bo&apos;lmasa avtomatik yaratiladi.
            </p>
          </div>

          <LoginForm
            next={next}
            initialError={params.error}
            emailEnabled={process.env.EMAIL_LOGIN === "on"}
          />

          <p className="text-center text-sm text-muted mt-6">
            <Link href="/" className="hover:text-fg font-semibold">
              ← Bosh sahifaga qaytish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
