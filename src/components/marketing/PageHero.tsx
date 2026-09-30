import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import { Highlight } from "@/components/motion/Highlight";

/** Suzuvchi so'zlar uchun tayyor joylar (o'ng tomonda, faqat katta ekranda) */
const WORD_SLOTS = [
  { left: "8%", top: "18%", rot: -7 },
  { left: "52%", top: "8%", rot: 5 },
  { left: "30%", top: "52%", rot: -3 },
  { left: "68%", top: "60%", rot: 7 },
];

/**
 * Sahifa boshidagi "jonli" hero (bosh sahifa uslubida): nishon, ajratilgan so'zli
 * sarlavha, qo'lyozma shior, tavsif va tugmalar navbatma-navbat chiqadi; fonda
 * sekin suzuvchi rangli nurlar, o'ngda qo'lyozma so'zlar yoki `aside` (masalan 3D sahna).
 */
export function PageHero({
  eyebrow,
  title,
  highlight,
  hand,
  words,
  actions,
  children,
  aside,
  className = "pb-14 sm:pb-16",
  bare,
  center,
}: {
  eyebrow: string;
  title: ReactNode;
  /** Sarlavhadagi ajratiladigan so'z (title matn bo'lsa) */
  highlight?: string;
  /** Qo'lyozma shior */
  hand?: string;
  /** O'ng tomonda suzib yuradigan inglizcha so'zlar (aside bo'lmasa) */
  words?: string[];
  actions?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
  /** Fon gradientisiz (sahifaning o'z foni ko'rinadi) */
  bare?: boolean;
  /** Matnni markazga (aside/words bo'lmaganda) */
  center?: boolean;
}) {
  const showWords = !aside && words && words.length > 0;
  return (
    <section className={cn("ph", bare && "ph-bare")}>
      {bare ? null : <div className="ph-bg" aria-hidden />}
      <div
        className={cn(
          "container-page relative flex flex-col gap-10 pt-14 sm:pt-20 lg:flex-row lg:items-center lg:justify-between",
          className,
        )}
      >
        <div className={cn("ph-copy max-w-2xl", center && "mx-auto items-center text-center")}>
          <p className="hero-pill">
            <i aria-hidden />
            {eyebrow}
          </p>
          <h1 className="display-title mt-5 text-[40px] sm:text-[56px]">
            {typeof title === "string" ? <Highlight text={title} word={highlight} /> : title}
          </h1>
          {hand ? <p className="hero-hand ph-hand">{hand}</p> : null}
          {children ? (
            <div className={cn("mt-4 max-w-xl text-[15px] leading-relaxed text-muted", center && "mx-auto")}>
              {children}
            </div>
          ) : null}
          {actions ? <div className={cn("mt-7 flex flex-wrap gap-3", center && "justify-center")}>{actions}</div> : null}
        </div>
        {aside}
        {showWords ? (
          <div className="ph-words" aria-hidden>
            {words.slice(0, WORD_SLOTS.length).map((w, i) => (
              <span
                key={w}
                className="ph-word"
                style={{ left: WORD_SLOTS[i].left, top: WORD_SLOTS[i].top, rotate: `${WORD_SLOTS[i].rot}deg`, animationDelay: `${0.5 + i * 0.18}s` }}
              >
                <span className="story-bob" style={{ animationDelay: `${-i * 1.7}s` }}>
                  {w}
                  <svg viewBox="0 0 120 12" preserveAspectRatio="none">
                    <path d="M3 8 C 30 3, 70 11, 117 5" />
                  </svg>
                </span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <span className="ph-rule" aria-hidden />
    </section>
  );
}
