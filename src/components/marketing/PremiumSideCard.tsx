import Link from "next/link";
import { Check, Star } from "react-feather";
import { ButtonLink } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";

/** Figma 05: o'ng tomondagi "Premium content" kartasi (yopishqoq) */
export function PremiumSideCard({
  unlocked,
  premiumUntil,
  text = "Bu testlar faqat Premium foydalanuvchilar uchun. Premium bilan barcha mock testlar, Writing va Speaking bo'yicha o'qituvchi tekshiruvi hamda batafsil tahlil ochiladi.",
}: {
  unlocked: boolean;
  premiumUntil?: string | null;
  text?: string;
}) {
  if (unlocked) {
    return (
      <div className="card-glass rounded-2xl p-7 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-950">
          <Star size={11} strokeWidth={2.5} aria-hidden /> Premium faol
        </span>
        <p className="display-title mt-5 text-[28px]">Hammasi ochiq</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Barcha testlar va to&apos;liq tekshiruv sizga ochiq.
          {premiumUntil ? ` Muddati: ${formatDate(premiumUntil)}.` : ""}
        </p>
        <ul className="mt-5 space-y-2 text-left text-sm text-muted">
          {["Testni bo'lib-bo'lib ishlash mumkin", "Javoblar avtomatik saqlanadi", "Natijalar profilingizda"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check size={15} className="shrink-0 text-success" aria-hidden /> {t}
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
      <p className="display-title mt-5 text-[30px]">Premium kontent</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{text}</p>
      <ButtonLink href="/premium" fullWidth className="mt-6">
        Premiumga o&apos;tish
      </ButtonLink>
      <Link href="/premium#tariflar" className="mt-4 inline-block text-[13px] text-muted underline underline-offset-2 hover:text-fg">
        Tariflarni ko&apos;rish
      </Link>
    </div>
  );
}
