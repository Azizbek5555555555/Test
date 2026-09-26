import Link from "next/link";
import { getContactSettings } from "@/lib/settings";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { BrandMark, BrandWordmark } from "./BrandLogo";

export async function Footer() {
  const contact = await getContactSettings();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: "Practice",
      links: [
        { href: "/full-mock", label: "Full Mock" },
        { href: "/latest-questions", label: "Oxirgi tushgan savollar" },
        { href: "/exam-checking", label: "Exam Full Checking" },
      ],
    },
    {
      title: "Learn",
      links: [
        { href: "/boost/articles", label: "Articles" },
        { href: "/boost/listening", label: "Listening Practice" },
        { href: "/vocabulary-battle", label: "Vocabulary Battle" },
        { href: "/leaderboard", label: "Leaderboard" },
      ],
    },
    {
      title: "Platforma",
      links: [
        { href: "/premium", label: "Premium" },
        { href: "/courses", label: "Offline kurslar" },
        { href: "/contact", label: "Biz bilan bog'lanish" },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-surface mt-16">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <BrandMark size={40} />
              <BrandWordmark className="text-xl" />
            </div>
            <p className="text-sm text-muted mt-3 max-w-xs leading-relaxed">
              {SITE_TAGLINE}
            </p>
            {contact.address ? (
              <p className="text-sm text-muted mt-4 leading-relaxed">
                {contact.address}
              </p>
            ) : null}
            {contact.working_hours ? (
              <p className={contact.address ? "text-sm text-muted mt-1" : "text-sm text-muted mt-4"}>
                {contact.working_hours}
              </p>
            ) : null}
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-bold text-sm mb-3">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-fg transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-xs text-muted">
              © {year} {SITE_NAME}. Barcha huquqlar himoyalangan.
            </p>
            <Link href="/privacy" className="text-xs text-muted hover:text-fg underline-offset-2 hover:underline">
              Maxfiylik siyosati
            </Link>
            <Link href="/terms" className="text-xs text-muted hover:text-fg underline-offset-2 hover:underline">
              Foydalanish shartlari
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={contact.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted hover:text-brand-600 transition-colors"
            >
              Telegram
            </a>
            <a
              href={contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted hover:text-brand-600 transition-colors"
            >
              Instagram
            </a>
            <a
              href={`tel:${contact.phone.replace(/\s/g, "")}`}
              className="text-sm text-muted hover:text-brand-600 transition-colors"
            >
              {contact.phone}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
