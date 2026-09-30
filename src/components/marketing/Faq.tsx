import { getT } from "@/i18n/server";
import { ChevronDown, MessageCircle } from "react-feather";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Figma: "Frequently Asked Questions" bloki — chapda aloqa kartasi,
 * o'ngda ochiladigan savollar (brauzerning <details> elementi, JS kerak emas).
 */
export async function FaqSection({
  items,
  title,
  eyebrow,
}: {
  items: FaqItem[];
  title?: string;
  eyebrow?: string;
}) {
  const t = await getT();
  title ??= t("Ko'p so'raladigan savollar", "Frequently asked questions");
  eyebrow ??= t("Savollar", "Questions");
  return (
    <section className="container-page py-20">
      <Reveal className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-success">{eyebrow}</p>
        <h2 className="display-title mt-3 text-[36px] sm:text-[44px]">{title}</h2>
        <p className="mt-2 text-sm text-muted">{t("Javoblar shu yerda", "Answers are right here")}</p>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="card-glass flex flex-col items-center justify-center rounded-2xl p-8 text-center">
          <span className="grid size-14 place-items-center rounded-2xl border border-line bg-ink-800 text-brand-400">
            <MessageCircle size={24} strokeWidth={1.75} aria-hidden />
          </span>
          <p className="display-title mt-5 text-2xl">{t("Boshqa savolingiz bormi?", "Have another question?")}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t("Bizga yozing — jamoamiz odatda bir necha soat ichida javob beradi.", "Write to us — our team usually replies within a few hours.")}
          </p>
          <ButtonLink href="/contact" variant="light" size="sm" className="mt-6">
            {t("Bog'lanish", "Contact us")}
          </ButtonLink>
        </Reveal>

        <Reveal delay={80} className="space-y-3">
          {items.map((item, i) => (
            <details
              key={item.q}
              open={i === 0}
              className="group card rounded-xl px-5 py-4 open:border-brand-400/30"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  size={18}
                  className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/** Figma: sahifa oxiridagi yashil kursiv iqtibos */
export function QuoteLine({ children }: { children: string }) {
  return (
    <Reveal as="p" className="container-page py-6 text-center font-display text-2xl italic text-success sm:text-[32px]">
      “{children}”
    </Reveal>
  );
}
