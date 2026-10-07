import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "react-feather";
import { getProfile, isStaff } from "@/lib/auth";
import { BrandMark, BrandWordmark } from "@/components/layout/BrandLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin panelga kirish",
  robots: { index: false, follow: false },
};

/** Xodimlar (admin / o'qituvchi) uchun login + parol bilan kirish sahifasi */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = rawNext?.startsWith("/admin") && !rawNext.startsWith("//") ? rawNext : "/admin";

  // Allaqachon kirgan xodim — to'g'ridan-to'g'ri panelga
  const profile = await getProfile();
  if (profile && isStaff(profile)) redirect(next);

  return (
    <div className="al">
      <div className="al-glow" aria-hidden />
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="al-card animate-fade-up">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2.5" aria-label="levelxenglish — bosh sahifa">
          <BrandMark size={34} />
          <BrandWordmark className="text-[24px] leading-none" />
        </Link>

        <div className="mt-7 text-center">
          <span className="al-badge">
            <Shield size={14} aria-hidden /> Admin panel
          </span>
          <h1 className="display-title mt-4 text-[32px]">Xodimlar uchun kirish</h1>
          <p className="mt-2 text-sm text-muted">Admin yoki o&apos;qituvchi login va parolingizni kiriting.</p>
        </div>

        {profile ? (
          <p className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-3 text-center text-[13px] text-fg">
            Siz o&apos;quvchi akkaunti bilan kirgansiz. Admin panel uchun xodim login va parolini kiriting.
          </p>
        ) : null}

        <div className="mt-7">
          <AdminLoginForm next={next} />
        </div>

        <div className="mt-7 border-t border-line pt-5 text-center text-[13px] text-muted">
          Google akkauntingiz admin bo&apos;lsa:{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-400 hover:underline">
            Google yoki e-mail orqali kirish →
          </Link>
        </div>
      </div>
    </div>
  );
}
