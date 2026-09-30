import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { OnboardingForm } from "./OnboardingForm";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Profilni to'ldirish", "Complete your profile") };
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const rawNext = params.next ?? "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const profile = await getProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent("/onboarding")}`);
  if (profile.onboarded && profile.full_name) redirect(next);
  const t = await getT();

  return (
    <div className="container-page py-12 sm:py-20">
      <div className="card p-6 sm:p-8 max-w-md mx-auto">
        <div className="text-center mb-7">
          <span className="text-4xl" aria-hidden>
            👋
          </span>
          <h1 className="text-2xl font-extrabold mt-3">{t("Deyarli tayyor!", "Almost there!")}</h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            {t(
              "Natijalaringiz va reytingda ismingiz ko'rinishi uchun uni kiriting.",
              "Enter your name so it appears on your results and the leaderboard.",
            )}
          </p>
        </div>

        <OnboardingForm
          defaultName={profile.full_name ?? ""}
          defaultPhone={profile.phone ?? ""}
          next={next}
        />
      </div>
    </div>
  );
}
