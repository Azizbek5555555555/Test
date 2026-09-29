import { SetupBanner } from "@/components/layout/SetupBanner";

// Kirish sahifasi har so'rovda serverda render qilinadi (sessiya tekshiriladi)
export const dynamic = "force-dynamic";

/** Kirish sahifalari: Figma "02 Login" — yuqori/pastki panelsiz, to'liq ekran */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh flex flex-col">
      <SetupBanner />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
