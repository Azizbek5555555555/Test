"use client";

import { useEffect, useRef } from "react";
import { clamp01, useMotionMode } from "@/components/story/motion";
import { cn } from "@/lib/format";

/**
 * "Cho'qqiga olib boruvchi yo'l" — tog' yonbag'ridagi so'qmoq.
 * Skroll qilinganda so'qmoq pastdan cho'qqigacha chiziladi, yorug' nuqta
 * (alpinist) u bo'ylab ko'tariladi, har bir lagerga yetganda nuqta yonadi va
 * pastdagi karta faollashadi. Cho'qqida bayroq hilpiraydi.
 * JS yo'q yoki "harakatni kamaytirish" yoqilgan bo'lsa — tayyor holat ko'rinadi.
 */

export interface TrailStep {
  title: string;
  text: string;
  camp: string;
}

const VB_W = 1000;
const VB_H = 340;

/** Lagerlar (kartalar ustunlari markazida: 10%, 30%, 50%, 70%, 90%) */
const CAMPS: [number, number][] = [
  [100, 300],
  [300, 254],
  [500, 206],
  [700, 150],
  [900, 56],
];

/** So'qmoq: lagerlar orasida yengil burilishlar */
const TRAIL: [number, number][] = [
  [22, 330],
  CAMPS[0],
  [205, 290],
  CAMPS[1],
  [410, 246],
  CAMPS[2],
  [612, 196],
  CAMPS[3],
  [812, 128],
  CAMPS[4],
];

/** Catmull-Rom → silliq kubik egri chiziq */
function smoothPath(pts: [number, number][]) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const TRAIL_D = smoothPath(TRAIL);

/** Asosiy tog' qirrasi (so'qmoqdan biroz yuqorida) */
const RIDGE_TOP =
  "M0 282 L70 272 L120 262 L175 258 L240 238 L290 226 L335 214 L390 206 L450 186 L505 170 " +
  "L560 158 L610 140 L668 118 L720 104 L770 92 L820 70 L862 58 L905 34 L928 50 L952 62 L1000 84";
const RIDGE = `${RIDGE_TOP} L1000 340 L0 340 Z`;
/** Orqa tog' tizmasi */
const FAR =
  "M0 340 L0 214 L60 180 L120 204 L190 150 L250 184 L320 132 L390 170 L460 118 L520 150 " +
  "L585 104 L640 136 L700 96 L760 122 L815 88 L870 112 L940 70 L1000 104 L1000 340 Z";
/** Cho'qqidagi qor */
const SNOW = "M872 54 L905 34 L928 50 L916 48 L906 58 L896 49 L884 56 Z";

/** Osmondagi yulduzlar (deterministik) */
const STARS: [number, number, number][] = [
  [60, 40, 1.4],
  [150, 90, 1],
  [230, 30, 1.2],
  [340, 70, 1],
  [420, 26, 1.6],
  [520, 60, 1],
  [600, 22, 1.2],
  [690, 48, 1],
  [760, 18, 1.4],
  [980, 30, 1.1],
  [30, 120, 1],
  [280, 120, 1.1],
];

export function SummitTrail({
  eyebrow,
  title,
  steps,
}: {
  eyebrow: string;
  title: string;
  steps: TrailStep[];
}) {
  const rootRef = useRef<HTMLElement>(null);
  const mode = useMotionMode();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scene = root.querySelector<HTMLElement>("[data-scene]");
    const trail = root.querySelector<SVGPathElement>("[data-trail]");
    const glow = root.querySelector<SVGPathElement>("[data-trail-glow]");
    const climber = root.querySelector<SVGGElement>("[data-climber]");
    const camps = Array.from(root.querySelectorAll<SVGGElement>("[data-camp]"));
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-card]"));
    if (!scene || !trail || !glow || !climber) return;

    const len = trail.getTotalLength();
    // Har bir lagerning so'qmoqdagi ulushi (eng yaqin nuqta bo'yicha)
    const stops = CAMPS.map(([cx, cy]) => {
      let best = 0;
      let bestD = Infinity;
      for (let s = 0; s <= 400; s++) {
        const pt = trail.getPointAtLength((len * s) / 400);
        const d = (pt.x - cx) ** 2 + (pt.y - cy) ** 2;
        if (d < bestD) {
          bestD = d;
          best = s / 400;
        }
      }
      return best;
    });

    const apply = (p: number) => {
      const off = (len * (1 - p)).toFixed(1);
      trail.style.strokeDashoffset = off;
      glow.style.strokeDashoffset = off;
      const pt = trail.getPointAtLength(len * p);
      climber.setAttribute(
        "transform",
        `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`,
      );
      climber.style.opacity = p > 0.005 && p < 0.995 ? "1" : "0";
      stops.forEach((f, i) => {
        const on = p >= f - 0.004;
        camps[i]?.classList.toggle("is-on", on);
        cards[i]?.classList.toggle("is-on", on);
      });
      root.classList.toggle("is-summit", p >= 0.995);
    };

    trail.style.strokeDasharray = `${len.toFixed(1)}`;
    glow.style.strokeDasharray = `${len.toFixed(1)}`;

    if (mode === "static") {
      root.classList.remove("st-js");
      trail.style.strokeDashoffset = "0";
      glow.style.strokeDashoffset = "0";
      apply(1);
      return;
    }
    root.classList.add("st-js");

    let target = 0;
    let cur = 0;
    let raf = 0;
    const read = () => {
      const r = scene.getBoundingClientRect();
      const vh = window.innerHeight;
      target = clamp01((vh * 0.85 - r.top) / (vh * 0.5 + r.height * 0.25));
    };
    const tick = () => {
      cur += (target - cur) * 0.1;
      if (Math.abs(target - cur) < 0.0008) cur = target;
      apply(cur);
      raf = cur === target ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      read();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([e]) => root.classList.toggle("is-live", e.isIntersecting),
      {
        rootMargin: "120px 0px",
      },
    );
    io.observe(root);

    read();
    cur = target;
    apply(cur);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [mode]);

  return (
    <section
      ref={rootRef}
      className="st container-page py-20 lg:py-24"
      data-mode={mode}
    >
      <div className="st-head">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="display-title text-4xl sm:text-5xl lg:text-[48px] text-balance-title">
          {title}
        </h2>
      </div>

      {/* ------------------------------------------------ Tog' sahnasi */}
      <div className="st-stage" aria-hidden>
        {/* Tog' ranglari CSS o'zgaruvchilaridan (--st-*): yorug' mavzuda tong manzarasi */}
        {/* cho'qqi ortidagi nur (maska tashqarisida — kesilmaydi) */}
        <div className="st-sun" />
        <div className="st-scene" data-scene>
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="st-svg">
            <defs>
              <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "var(--st-sky, #1b2550)" }} stopOpacity="0" />
                <stop offset="1" style={{ stopColor: "var(--st-sky, #1b2550)" }} stopOpacity="0.55" />
              </linearGradient>
              <linearGradient id="st-far" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "var(--st-far-a, #2c3767)" }} />
                <stop offset="1" style={{ stopColor: "var(--st-far-b, #141c38)" }} />
              </linearGradient>
              <linearGradient id="st-near" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "var(--st-near-a, #262e52)" }} />
                <stop offset="0.55" style={{ stopColor: "var(--st-near-b, #1a2240)" }} />
                <stop offset="1" style={{ stopColor: "var(--st-near-c, #111830)" }} />
              </linearGradient>
              <linearGradient id="st-trail" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#10bfa6" />
                <stop offset="1" stopColor="#7cc4f0" />
              </linearGradient>
              <radialGradient id="st-halo">
                <stop offset="0" stopColor="#c9f1ea" stopOpacity="0.9" />
                <stop offset="1" stopColor="#c9f1ea" stopOpacity="0" />
              </radialGradient>
              <clipPath id="st-mount">
                <path d={RIDGE} />
              </clipPath>
            </defs>

            <rect width={VB_W} height={VB_H} fill="url(#st-sky)" />
            <g className="st-stars">
              {STARS.map(([x, y, r], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={r}
                  style={{ animationDelay: `${(i * 0.53) % 4}s` }}
                />
              ))}
            </g>

            <path d={FAR} fill="url(#st-far)" opacity="0.55" />
            <path d={RIDGE} fill="url(#st-near)" />
            {/* topografik chiziqlar — faqat tog' ichida */}
            <g clipPath="url(#st-mount)" className="st-contours">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <path
                  key={i}
                  d={`M-20 ${330 - i * 14} Q 420 ${300 - i * 30}, 1020 ${140 - i * 22}`}
                />
              ))}
            </g>
            <path d={RIDGE_TOP} fill="none" className="st-ridge" />
            <path d={SNOW} fill="#e9e3dc" opacity="0.85" />

            {/* bayroq */}
            <g className="st-flag">
              <line x1="905" y1="34" x2="905" y2="4" />
              <path d="M905 5 L944 13 L905 22 Z" className="st-flag-cloth" />
            </g>

            {/* lagerlardan kartalarga tushuvchi chiziqlar */}
            {CAMPS.map(([x, y], i) => (
              <line
                key={i}
                x1={x}
                y1={y + 12}
                x2={x}
                y2={VB_H}
                className="st-drop"
                data-drop={i}
              />
            ))}

            {/* so'qmoq: xira yo'l + yonib boruvchi chiziq */}
            <path d={TRAIL_D} className="st-path-ghost" />
            <path d={TRAIL_D} className="st-path-glow" data-trail-glow />
            <path d={TRAIL_D} className="st-path" data-trail />

            {CAMPS.map(([x, y], i) => (
              <g
                key={i}
                className="st-camp"
                data-camp
                transform={`translate(${x} ${y})`}
              >
                <circle r="15" className="st-camp-ring" />
                <circle r="7" className="st-camp-dot" />
              </g>
            ))}

            <g data-climber className="st-climber" style={{ opacity: 0 }}>
              <circle r="16" fill="url(#st-halo)" />
              <circle r="5" className="st-climber-dot" />
            </g>
          </svg>
        </div>
      </div>

      {/* ------------------------------------------------ Qadamlar */}
      <ol className="st-cards">
        {steps.map((step, i) => (
          <li
            key={step.title}
            data-card
            className={cn(
              "st-card",
              i === steps.length - 1 && "st-card-summit",
            )}
          >
            <div className="st-card-top">
              <span className="st-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="st-camp-tag">{step.camp}</span>
            </div>
            <h3 className="display-title text-[22px] font-semibold">
              {step.title}
            </h3>
            <p className="text-[13px] leading-relaxed text-muted">
              {step.text}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
