import { getT } from "@/i18n/server";
import Link from "next/link";
import { Check, Star } from "react-feather";
import { ButtonLink } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";

/** Figma 05: o'ng tomondagi "Premium content" kartasi (yopishqoq) */
export async function PremiumSideCard({
  unlocked,
  premiumUntil,
  text,
}: {
  unlocked: boolean;
  premiumUntil?: string | null;
  text?: string;
}) {
  const t = await getT();
  if (unlocked) {
    return (
      <div className="card-glass rounded-2xl p-7 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-950">
          <Star size={11} strokeWidth={2.5} aria-hidden /> {t("Premium faol", "Premium active")}
        </span>
        <p className="display-title mt-5 text-[28px]">{t("Hammasi ochiq", "Everything unlocked")}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t("Barcha testlar va to'liq tekshiruv sizga ochiq.", "All tests and full reviews are open to you.")}
          {premiumUntil ? ` ${t("Muddati", "Valid until")}: ${formatDate(premiumUntil, t.locale)}.` : ""}
        </p>
        <ul className="mt-5 space-y-2 text-left text-sm text-muted">
          {[
            t("Testni bo'lib-bo'lib ishlash mumkin", "You can take tests in several sittings"),
            t("Javoblar avtomatik saqlanadi", "Answers are saved automatically"),
            t("Natijalar profilingizda", "Results appear in your profile"),
          ].map((line) => (
            <li key={line} className="flex items-center gap-2">
              <Check size={15} className="shrink-0 text-success" aria-hidden /> {line}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-ink-800 p-7 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-950">
        <Star size={11} strokeWidth={2.5} aria-hidden /> Premium
      </span>
      <p className="display-title mt-5 text-[30px]">{t("Premium kontent", "Premium content")}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {text ??
          t(
            "Bu testlar faqat Premium foydalanuvchilar uchun. Premium bilan barcha mock testlar, Writing va Speaking bo'yicha o'qituvchi tekshiruvi hamda batafsil tahlil ochiladi.",
            "These tests are for Premium members only. Premium unlocks all mock tests, teacher review for Writing and Speaking, and a detailed breakdown.",
          )}
      </p>
      <ButtonLink href="/premium" fullWidth className="mt-6">
        {t("Premiumga o'tish", "Go Premium")}
      </ButtonLink>
      <Link href="/premium#tariflar" className="mt-4 inline-block text-[13px] text-muted underline underline-offset-2 hover:text-fg">
        {t("Tariflarni ko'rish", "See plans")}
      </Link>
    </div>
  );
}
