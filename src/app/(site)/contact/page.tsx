import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { getContactSettings } from "@/lib/settings";
import { ContactSection } from "@/components/marketing/ContactSection";

export const metadata: Metadata = {
  title: "Biz bilan bog'lanish",
  description:
    "Telegram, Instagram, telefon va email — LevelX English bilan bog'lanish uchun.",
};

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
