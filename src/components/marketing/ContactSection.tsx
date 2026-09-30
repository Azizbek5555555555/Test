import { getT } from "@/i18n/server";
import { Instagram, Mail, MapPin, Phone, Send } from "react-feather";
import type { ContactSettings } from "@/lib/types";
import { ContactForm } from "@/components/forms/ContactForm";
import { Reveal } from "@/components/motion/Reveal";
import { Highlight } from "@/components/motion/Highlight";

/**
 * Figma 10: "We are here to guide your ascent" — chapda aloqa kanallari,
 * o'ngda xabar yuborish formasi.
 */
export async function ContactSection({
  contact,
  defaults,
  as: Heading = "h2",
}: {
  contact: ContactSettings;
  defaults?: { name?: string | null; email?: string | null; phone?: string | null };
  as?: "h1" | "h2";
}) {
  const t = await getT();
  const channels = [
    { icon: Send, label: t("Telegram kanal", "Telegram channel"), value: contact.telegram_label, href: contact.telegram, external: true },
    ...(contact.telegram_admin
      ? [
          {
            icon: Send,
            label: "Telegram admin",
            value: contact.telegram_admin_label || contact.telegram_admin,
            href: contact.telegram_admin,
            external: true,
          },
        ]
      : []),
    { icon: Instagram, label: "Instagram", value: contact.instagram_label, href: contact.instagram, external: true },
    { icon: Phone, label: t("Telefon", "Phone"), value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}`, external: false },
    { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}`, external: false },
  ];

  return (
    <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal>
        {Heading === "h1" ? (
          <p className="hero-pill">
            <i aria-hidden />
            {t("Savollaringiz bormi?", "Have questions?")}
          </p>
        ) : (
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">{t("Savollaringiz bormi?", "Have questions?")}</p>
        )}
        <Heading
          className={
            Heading === "h1"
              ? "display-title mt-5 text-[40px] leading-tight sm:text-[52px]"
              : "display-title mt-3 text-[34px] leading-tight sm:text-[40px]"
          }
        >
          {t("Cho'qqi sari yo'lda", "On the way to the summit, we're")}{" "}
          {Heading === "h1" ? (
            <Highlight text={t("yoningizdamiz", "beside you")} word={t("yoningizdamiz", "beside you")} />
          ) : (
            t("yoningizdamiz", "beside you")
          )}
        </Heading>
        {Heading === "h1" ? <p className="hero-hand">We&apos;re here to help</p> : null}
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
          {t(
            "Jamoamiz bilan bog'laning — Premium, to'lov, kurslar yoki natijalar bo'yicha savollaringizga javob beramiz.",
            "Get in touch with our team — we will answer your questions about Premium, payments, courses or results.",
          )}
        </p>
        <ul className="mt-8 space-y-5">
          {channels.map((c) => (
            <li key={c.label}>
              <a
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-ink-800 text-brand-400 transition-colors group-hover:border-brand-400">
                  <c.icon size={16} strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                    {c.label}
                  </span>
                  <span className="block truncate text-sm font-semibold text-fg group-hover:text-brand-400">
                    {c.value}
                  </span>
                </span>
              </a>
            </li>
          ))}
          {contact.address ? (
            <li className="flex items-center gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-ink-800 text-brand-400">
                <MapPin size={16} strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{t("Manzil", "Address")}</span>
                <span className="block text-sm font-semibold text-fg">{contact.address}</span>
                {contact.working_hours ? (
                  <span className="block text-xs text-muted">{contact.working_hours}</span>
                ) : null}
                {contact.map_url ? (
                  <a
                    href={contact.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300"
                  >
                    {t("Xaritada ko'rish", "View on map")} →
                  </a>
                ) : null}
              </span>
            </li>
          ) : null}
        </ul>
      </Reveal>

      <Reveal delay={100} className="rounded-2xl border border-line bg-ink-800 p-6 sm:p-8">
        <p className="display-title text-[26px]">{t("Xabar yuborish", "Send a message")}</p>
        <p className="mb-6 mt-1 text-sm text-muted">{t("Formani to'ldiring — imkon qadar tez javob beramiz.", "Fill in the form — we will reply as soon as we can.")}</p>
        <ContactForm
          defaultName={defaults?.name}
          defaultEmail={defaults?.email}
          defaultPhone={defaults?.phone}
        />
      </Reveal>
    </div>
  );
}
