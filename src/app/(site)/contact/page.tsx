import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { getContactSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/Card";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Biz bilan bog'lanish",
  description:
    "Telegram, Instagram, telefon, email va manzil — Multilevel Plus bilan bog'lanish uchun.",
};

export default async function ContactPage() {
  const [contact, profile] = await Promise.all([
    getContactSettings(),
    getProfile(),
  ]);

  const channels = [
    {
      icon: "✈️",
      label: "Telegram",
      value: contact.telegram_label,
      href: contact.telegram,
      external: true,
      accent: "from-sky-500 to-blue-600",
    },
    {
      icon: "📸",
      label: "Instagram",
      value: contact.instagram_label,
      href: contact.instagram,
      external: true,
      accent: "from-fuchsia-500 to-rose-600",
    },
    {
      icon: "📞",
      label: "Telefon",
      value: contact.phone,
      href: `tel:${contact.phone.replace(/\s/g, "")}`,
      external: false,
      accent: "from-emerald-500 to-teal-600",
    },
    {
      icon: "✉️",
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
      external: false,
      accent: "from-violet-500 to-purple-600",
    },
  ];

  return (
    <div className="container-page py-10">
      <PageHeader
        eyebrow="Contact us"
        title="Biz bilan bog'lanish"
        description="Savollaringiz, takliflaringiz yoki kurslar bo'yicha murojaatlaringizni kutamiz."
      />

      <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            {channels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                target={channel.external ? "_blank" : undefined}
                rel={channel.external ? "noopener noreferrer" : undefined}
                className="group card p-5 flex items-center gap-4
                           hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <span
                  className={`w-12 h-12 rounded-2xl grid place-items-center text-xl shrink-0
                              bg-gradient-to-br ${channel.accent} text-white shadow-sm`}
                  aria-hidden
                >
                  {channel.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {channel.label}
                  </p>
                  <p className="font-bold truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {channel.value}
                  </p>
                </div>
              </a>
            ))}
          </div>

          <div className="card p-6">
            <h2 className="font-extrabold text-lg mb-3">📍 Manzil</h2>
            <p className="leading-relaxed">{contact.address}</p>
            {contact.working_hours ? (
              <p className="text-sm text-muted mt-2">
                🕐 {contact.working_hours}
              </p>
            ) : null}
            {contact.map_url ? (
              <a
                href={contact.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 rounded-xl border border-line
                           bg-[var(--bg-subtle)] px-4 py-2.5 text-sm font-semibold
                           hover:border-brand-400 transition-colors"
              >
                🗺️ Xaritada ko&apos;rish
              </a>
            ) : null}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-extrabold text-lg">Xabar yozing</h2>
          <p className="text-sm text-muted mt-1.5 mb-5">
            Formani to&apos;ldiring — imkon qadar tez javob beramiz.
          </p>

          <ContactForm
            defaultName={profile?.full_name}
            defaultEmail={profile?.email}
            defaultPhone={profile?.phone}
          />
        </div>
      </div>
    </div>
  );
}
