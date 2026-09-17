import { Header } from "@/components/layout/Header";
// Sahifalar foydalanuvchiga moslashtiriladi (Premium, ism, natijalar),
// shuning uchun ular har so'rovda serverda render qilinadi.
export const dynamic = "force-dynamic";

import { Footer } from "@/components/layout/Footer";
import { SetupBanner } from "@/components/layout/SetupBanner";

/** Saytning odatiy ko'rinishi: yuqori panel + kontent + pastki panel */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh flex flex-col">
      <SetupBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
