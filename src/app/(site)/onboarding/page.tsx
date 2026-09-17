import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: "Profilni to'ldirish" };

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

  return (
    <div className="container-page py-12 sm:py-20">
      <div className="card p-6 sm:p-8 max-w-md mx-auto">
        <div className="text-center mb-7">
          <span className="text-4xl" aria-hidden>
            👋
          </span>
          <h1 className="text-2xl font-extrabold mt-3">Deyarli tayyor!</h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            Natijalaringiz va reytingda ismingiz ko&apos;rinishi uchun uni
            kiriting.
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
