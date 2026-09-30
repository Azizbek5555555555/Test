import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { getContactSettings } from "@/lib/settings";
import { ContactSection } from "@/components/marketing/ContactSection";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Biz bilan bog'lanish", "Contact us"),
    description: t(
      "Telegram, Instagram, telefon va email — LevelX English bilan bog'lanish uchun.",
      "Telegram, Instagram, phone and email — ways to reach LevelX English.",
    ),
  };
}

export default async function ContactPage() {
  const [contact, profile] = await Promise.all([getContactSettings(), getProfile()]);

  return (
    <div className="ph">
      <div className="ph-bg" aria-hidden />
      <section className="container-page pb-20 pt-14 sm:pt-20">
        <ContactSection
          as="h1"
          contact={contact}
          defaults={{ name: profile?.full_name, email: profile?.email, phone: profile?.phone }}
        />
      </section>
    </div>
  );
}
