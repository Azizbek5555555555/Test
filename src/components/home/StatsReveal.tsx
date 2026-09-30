"use client";

import { useEffect, useRef } from "react";
import { BookOpen, Database, FileText, Headphones } from "react-feather";

const ICONS = { mock: FileText, listening: Headphones, article: BookOpen, question: Database } as const;

export interface StatItem {
  value: number;
  label: string;
  icon: keyof typeof ICONS;
}

const format = (n: number) => n.toLocaleString("ru-RU");

/**
 * Raqamlar lentasi: ekranga kirganda markazdan ikki tomonga oltin chiziq otiladi,
 * panel o'rtadan ochiladi, chap va o'ng raqamlar yon tomondan kirib keladi va
 * 0 dan sanaladi. JS bo'lmasa yoki "harakatni kamaytirish" yoqilgan bo'lsa —
 * darhol tayyor holatda (qurollantirish faqat JS ichida qilinadi).
 */
export function StatsReveal({ items, eyebrow }: { items: StatItem[]; eyebrow: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const values = Array.from(root.querySelectorAll<HTMLElement>("[data-to]"));
    values.forEach((el) => (el.textContent = "0"));
    root.dataset.armed = "";

    let raf = 0;
    const count = () => {
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0 - 450) / 1500);
        const e = k <= 0 ? 0 : 1 - Math.pow(1 - k, 3);
        for (const el of values) el.textContent = format(Math.round(Number(el.dataset.to) * e));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        root.classList.add("is-open");
        count();
        io.disconnect();
      },
      { threshold: 0.45 },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const half = items.length / 2;
  return (
    <section className="container-page pt-10 pb-14 lg:pt-14 lg:pb-16">
      <div ref={rootRef} className="sx">
        <span className="sx-gem" aria-hidden />
        <span className="sx-line sx-line-top" aria-hidden />
        <span className="sx-line sx-line-bottom" aria-hidden />
        <div className="sx-panel">
          <p className="sx-eyebrow">{eyebrow}</p>
          <ul className="sx-grid">
            {items.map((item, i) => {
              const Icon = ICONS[item.icon];
              return (
                <li
                  key={item.label}
                  className="sx-item"
                  style={
                    {
                      // telefonda: 2 ustun (chap/o'ng), kompyuterda: birinchi yarmi chapdan, qolgani o'ngdan
                      "--dx-sm": i % 2 === 0 ? -1 : 1,
                      "--dx-lg": i < half ? -1 : 1,
                      "--d": `${Math.abs(i - (items.length - 1) / 2) * 90}ms`,
                    } as React.CSSProperties
                  }
                >
                  <span className="sx-icon">
                    <Icon size={18} strokeWidth={1.7} />
                  </span>
                  <p className="sx-value">
                    {item.value > 0 ? <span data-to={item.value}>{format(item.value)}</span> : "—"}
                  </p>
                  <p className="sx-label">{item.label}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
