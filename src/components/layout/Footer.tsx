import Link from "next/link";
import { getContactSettings } from "@/lib/settings";
import { COURSES_ENABLED, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { BrandMark, BrandWordmark } from "./BrandLogo";

/**
 * Figma: footer-section — ink/surface fon, 80px yuqori / 48px pastki bo'shliq.
 * Brend + iqtibos + tavsif · tezkor havolalar · aloqa kanallari · manzil.
 */
export async function Footer() {
  const contact = await getContactSettings();
  const year = new Date().getFullYear();

  const quickLinks = [
    { href: "/full-mock", label: "Full Mock" },
    { href: "/latest-questions", label: "Oxirgi savollar" },
    { href: "/boost", label: "General English" },
    { href: "/vocabulary-battle", label: "Vocabulary Battle" },
    { href: "/exam-checking", label: "Exam Full Checking" },
    ...(COURSES_ENABLED ? [{ href: "/courses", label: "Offline kurslar" }] : []),
    { href: "/premium", label: "Premium" },
  ];

  const channels = [
    contact.telegram ? { href: contact.telegram, label: `Telegram: ${contact.telegram_label}`, external: true } : null,
    contact.instagram ? { href: contact.instagram, label: `Instagram: ${contact.instagram_label}`, external: true } : null,
    contact.phone ? { href: `tel:${contact.phone.replace(/[^\d+]/g, "")}`, label: contact.phone, external: false } : null,
    contact.email ? { href: `mailto:${contact.email}`, label: contact.email, external: false } : null,
  ].filter(Boolean) as { href: string; label: string; external: boolean }[];

  return (
    <footer className="bg-surface mt-24 print:hidden">
      <div className="container-page pt-16 lg:pt-20 pb-12">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[minmax(0,400px)_1fr_1fr_1fr] lg:gap-10">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-3" aria-label={SITE_NAME}>
              <BrandMark size={36} />
              <BrandWordmark className="text-[28px] leading-none" />
            </Link>
            <p className="font-display italic text-xl text-brand-400">
              “{SITE_TAGLINE}”
            </p>
            <p className="text-[13px] leading-relaxed text-faint max-w-sm">
              Multilevel imtihoniga tayyorgarlik uchun puxta ishlangan materiallar:
              real mock testlar, oxirgi tushgan savollar va o&apos;qituvchi
              tekshiruvi. Qadamma-qadam — cho&apos;qqiga.
            </p>
          </div>

          <FooterColumn title="Platforma">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted hover:text-brand-300 transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Aloqa kanallari">
            {channels.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="text-sm text-muted hover:text-brand-300 transition-colors break-all"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/contact" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                Xabar yuborish →
              </Link>
            </li>
          </FooterColumn>

          {contact.address || contact.working_hours ? (
            <FooterColumn title="Manzil">
              {contact.address ? (
                <li className="text-[13px] leading-normal text-muted">{contact.address}</li>
              ) : null}
              {contact.working_hours ? (
                <li className="text-xs text-faint">{contact.working_hours}</li>
              ) : null}
            </FooterColumn>
          ) : null}
        </div>

        <div className="mt-12 pt-6 border-t border-line flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between text-[13px] text-faint">
          <p>
            © {year} {SITE_NAME}. Cho&apos;qqingiz uchun puxta ishlangan.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-fg transition-colors">
              Maxfiylik siyosati
            </Link>
            <Link href="/terms" className="hover:text-fg transition-colors">
              Foydalanish shartlari
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-fg mb-4">
        {title}
      </h3>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}
