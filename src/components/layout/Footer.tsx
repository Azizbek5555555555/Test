import { getT } from "@/i18n/server";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, Instagram, Mail, Phone, Send } from "react-feather";
import { getContactSettings } from "@/lib/settings";
import { getProfile } from "@/lib/auth";
import { COURSES_ENABLED, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { Reveal } from "@/components/motion/Reveal";
import { BrandMark, BrandWordmark } from "./BrandLogo";

type IconType = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

/**
 * Pastki panel — hero'dagi kabi katta yumaloq "oyna":
 *  - yuqorida chaqiruv (mehmon uchun ro'yxatdan o'tish, o'quvchi uchun keyingi mashq);
 *  - brend, ijtimoiy tarmoq tugmalari, havolalar ustunlari, aloqa;
 *  - pastda katta "levelxenglish" yozuvi va huquqiy havolalar.
 */
export async function Footer() {
  const [contact, profile, t] = await Promise.all([getContactSettings(), getProfile(), getT()]);
  const year = new Date().getFullYear();

  const platform = [
    { href: "/full-mock", label: "Full Mock" },
    { href: "/latest-questions", label: t("Oxirgi savollar", "Latest questions") },
    { href: "/boost", label: "General English" },
    { href: "/vocabulary-battle", label: "Vocabulary Battle" },
    { href: "/exam-checking", label: "Exam Full Checking" },
  ];
  const more = [
    { href: "/premium", label: "Premium" },
    ...(COURSES_ENABLED ? [{ href: "/courses", label: t("Offline kurslar", "Offline courses") }] : []),
    { href: "/leaderboard", label: t("Reyting", "Leaderboard") },
    { href: "/contact", label: t("Biz bilan bog'lanish", "Contact us") },
  ];

  const socials = [
    contact.telegram ? { href: contact.telegram, label: "Telegram", icon: Send, external: true } : null,
    contact.instagram ? { href: contact.instagram, label: "Instagram", icon: Instagram, external: true } : null,
    contact.phone ? { href: `tel:${contact.phone.replace(/[^\d+]/g, "")}`, label: contact.phone, icon: Phone, external: false } : null,
    contact.email ? { href: `mailto:${contact.email}`, label: contact.email, icon: Mail, external: false } : null,
  ].filter(Boolean) as { href: string; label: string; icon: IconType; external: boolean }[];

  const channels = [
    contact.telegram ? { href: contact.telegram, label: contact.telegram_label || "Telegram", kind: "Telegram", external: true } : null,
    contact.instagram ? { href: contact.instagram, label: contact.instagram_label || "Instagram", kind: "Instagram", external: true } : null,
    contact.phone ? { href: `tel:${contact.phone.replace(/[^\d+]/g, "")}`, label: contact.phone, kind: t("Telefon", "Phone"), external: false } : null,
    contact.email ? { href: `mailto:${contact.email}`, label: contact.email, kind: "E-mail", external: false } : null,
  ].filter(Boolean) as { href: string; label: string; kind: string; external: boolean }[];

  const cta = profile
    ? {
        title: t("Bugungi mashqingiz kutyapti", "Today's practice is waiting"),
        text: t("Har kuni kichik qadam — imtihon kuni katta natija.", "A small step every day — a big result on exam day."),
        primary: { href: "/full-mock", label: t("Full Mock ishlash", "Take a Full Mock") },
        secondary: { href: "/profile/results", label: t("Natijalarim", "My results") },
      }
    : {
        title: t("Cho'qqiga birinchi qadamni bugun qo'ying", "Take your first step to the summit today"),
        text: t("Bepul ro'yxatdan o'ting — mock testlar, so'nggi savollar va natija tahlili.", "Sign up free — mock tests, the latest questions and a results breakdown."),
        primary: { href: "/login", label: t("Bepul boshlash", "Start free") },
        secondary: { href: "/full-mock", label: t("Testlarni ko'rish", "Browse tests") },
      };

  return (
    <footer className="sf print:hidden">
      <div className="container-page">
        <div className="sf-frame">
          <div className="sf-bg" aria-hidden>
            <Image src="/design/ambient-peak-teal.jpg" alt="" fill sizes="(min-width: 1280px) 1280px, 100vw" className="object-cover" />
          </div>
          <div className="sf-shade" aria-hidden />

          {/* ------------------------------------------------ Chaqiruv */}
          <Reveal className="sf-cta">
            <div>
              <p className="sf-cta-title">{cta.title}</p>
              <p className="sf-cta-text">{cta.text}</p>
            </div>
            <div className="sf-cta-actions">
              <Link href={cta.primary.href} className="sf-btn sf-btn-primary">
                {cta.primary.label} <ArrowUpRight size={16} aria-hidden />
              </Link>
              <Link href={cta.secondary.href} className="sf-btn">
                {cta.secondary.label}
              </Link>
            </div>
          </Reveal>

          {/* ------------------------------------------------ Asosiy qism */}
          <div className="sf-main">
            <div className="sf-brand">
              <Link href="/" className="inline-flex items-center gap-3" aria-label={SITE_NAME}>
                <BrandMark size={38} />
                <BrandWordmark className="text-[28px] leading-none" />
              </Link>
              <p className="sf-tagline">“{SITE_TAGLINE}”</p>
              <p className="sf-about">
                {t(
                  "Multilevel imtihoniga tayyorgarlik uchun puxta ishlangan materiallar: real mock testlar, oxirgi tushgan savollar va o'qituvchi tekshiruvi. Qadamma-qadam — cho'qqiga.",
                  "Carefully crafted materials to prepare for the Multilevel exam: real mock tests, the latest exam questions and teacher feedback. Step by step — to the summit.",
                )}
              </p>
              {socials.length ? (
                <ul className="sf-socials">
                  {socials.map((s) => {
                    const Icon = s.icon;
                    return (
                      <li key={s.href}>
                        <a
                          href={s.href}
                          aria-label={s.label}
                          title={s.label}
                          {...(s.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          <Icon size={17} strokeWidth={1.8} aria-hidden />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>

            <FooterColumn title={t("Platforma", "Platform")}>
              {platform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="sf-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </FooterColumn>

            <FooterColumn title={t("Foydali", "More")}>
              {more.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="sf-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </FooterColumn>

            <FooterColumn title={t("Aloqa", "Contact")}>
              {channels.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="sf-channel"
                  >
                    <small>{item.kind}</small>
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
              {contact.address ? (
                <li className="sf-channel">
                  <small>{t("Manzil", "Address")}</small>
                  <span>{contact.address}</span>
                  {contact.working_hours ? <span className="sf-hours">{contact.working_hours}</span> : null}
                </li>
              ) : null}
              <li>
                <Link href="/contact" className="sf-link sf-link-accent">
                  {t("Xabar yuborish", "Send a message")} <ArrowRight size={14} aria-hidden />
                </Link>
              </li>
            </FooterColumn>
          </div>

          {/* ------------------------------------------------ Katta yozuv */}
          <Reveal className="sf-word-wrap">
            <p className="sf-word" aria-hidden>
              {"levelxenglish".split("").map((ch, i) => (
                <span key={i} className={ch === "x" ? "sf-x" : undefined} style={{ "--i": i } as CSSProperties}>
                  {ch}
                </span>
              ))}
            </p>
          </Reveal>

          <div className="sf-bottom">
            <p>
              © {year} {SITE_NAME} · levelx.academy
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/privacy" className="sf-link">
                {t("Maxfiylik siyosati", "Privacy policy")}
              </Link>
              <Link href="/terms" className="sf-link">
                {t("Foydalanish shartlari", "Terms of use")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="sf-col-title">{title}</h3>
      <ul className="sf-col">{children}</ul>
    </div>
  );
}
