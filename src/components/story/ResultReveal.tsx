"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  REVEAL_HEIGHT,
  REVEAL_LEAD,
  REVEAL_KEYFRAMES,
  REVEAL_RESULT,
  REVEAL_TIMES,
  RIBBONS,
  STORY_EASE,
  type Keyframe,
  type Range,
} from "@/lib/home-story";
import { cn } from "@/lib/format";
import { LogoSeal } from "./LogoSeal";
import { clamp01, rangeT, smooth, useMotionMode } from "./motion";

const VB_W = 1440;
const VB_H = 900;
const CARD_W = 680;
const CARD_H = 460;
/** Yaltiroq chiziqlar to'liq chizilgandan keyin o'tadi */
const SHINE_FROM = 0.56;
const SHINE_TO = 0.84;

/** JavaScript o'chiq bo'lsa: animatsiyasiz, tayyor ochilgan varaq */
const NOSCRIPT_CSS = [
  ".rr{height:auto!important}",
  ".rr-stage{position:relative!important}",
  ".rr-line,[data-rsign]{stroke-dashoffset:0!important}",
  "[data-rtext=intro],.rr-head{display:none!important}",
  "[data-rtext=outro]{opacity:1!important;visibility:visible!important}",
  "[data-rk=card]{transform:translateY(-4svh) rotate(-1deg) scale(.93)!important}",
  "[data-rk=shadow]{transform:translateY(-4svh) scale(.93)!important;opacity:.6!important}",
  "[data-rk=stamp]{opacity:1!important;transform:rotate(-10deg)!important}",
  "[data-rk=rim]{opacity:1!important}",
  "[data-rreveal]{clip-path:none!important}",
  "@media (max-width:1023px){.rr-scaler{--card-scale:.8}}",
  "@media (max-width:767px){.rr-scaler{--card-scale:.52}}",
].join("");

/** Kalit kadrlar orasida silliq qiymat */
function sample(frames: Keyframe[], p: number) {
  const out: Partial<Record<keyof Keyframe, number>> = {};
  for (const k of ["x", "y", "r", "rx", "ry", "s", "o"] as const) {
    let prev: Keyframe | undefined;
    let next: Keyframe | undefined;
    for (const f of frames) {
      if (f[k] === undefined) continue;
      if (f.p <= p) prev = f;
      else {
        next = f;
        break;
      }
    }
    if (!prev && !next) continue;
    if (!prev) out[k] = next![k];
    else if (!next) out[k] = prev[k];
    else out[k] = prev[k]! + (next[k]! - prev[k]!) * smooth((p - prev.p) / (next.p - prev.p));
  }
  return out;
}

function windowOpacity(p: number, [a, b]: Range, openStart: boolean, openEnd: boolean) {
  const e = (b - a) * 0.2;
  if (p < a) return openStart ? 1 : 0;
  if (p > b) return openEnd ? 1 : 0;
  const fin = openStart ? 1 : clamp01((p - a) / e);
  const fout = openEnd ? 1 : clamp01((b - p) / e);
  return smooth(Math.min(fin, fout));
}

/** Har bir ball o'z navbatida sanaladi */
function scoreRange(i: number): Range {
  const [a, b] = REVEAL_TIMES.scores;
  const step = (b - a) / (REVEAL_RESULT.scores.length + 1);
  return [a + i * step, a + i * step + step * 2];
}

/** Takrorlanadigan "tasodifiy" son (har yuklashda bir xil joylashuv) */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function ResultReveal() {
  const mode = useMotionMode();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const stage = root.querySelector<HTMLElement>("[data-rstage]");
    const scaler = root.querySelector<HTMLElement>("[data-rscaler]");
    const sparkLayer = root.querySelector<HTMLElement>("[data-sparks]");
    if (!stage || !scaler || !sparkLayer) return;
    const isStatic = mode === "static";

    const q = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
    const kfEls = q("[data-rk]").map((el) => ({ el, frames: REVEAL_KEYFRAMES[el.dataset.rk!] ?? [], basis: el.dataset.basis }));
    const counts = q("[data-rcount]").map((el) => {
      const key = el.dataset.rcount!;
      const idx = REVEAL_RESULT.scores.findIndex((s) => s.key === key);
      return {
        el,
        to: idx >= 0 ? REVEAL_RESULT.scores[idx].value : REVEAL_RESULT.overall,
        range: idx >= 0 ? scoreRange(idx) : REVEAL_TIMES.overall,
        last: -1,
      };
    });
    const reveals = q("[data-rreveal]").map((el) => ({ el, range: REVEAL_TIMES[el.dataset.rreveal as "name" | "comment"] }));
    const signature = root.querySelector<SVGPathElement>("[data-rsign]");
    const ribbonGroups = RIBBONS.map((_, i) => Array.from(root.querySelectorAll<SVGPathElement>(`[data-ribbon="${i}"]`)));
    const heads = q("[data-head]");
    const center = root.querySelector<HTMLElement>("[data-rcenter]");
    const shines = RIBBONS.map((_, i) => root.querySelector<SVGPathElement>(`[data-shine="${i}"]`));
    const texts = q("[data-rtext]").map((el) => ({ el, key: el.dataset.rtext as "intro" | "outro" }));

    // Chiziq uzunliklari va uchqun joylari (SVG geometriyasidan)
    const mainPaths = ribbonGroups.map((g) => g[0]);
    const lengths = mainPaths.map((path) => path?.getTotalLength() ?? 1);

    type Spark = { el: HTMLElement; ribbon: number; t: number; lastO: number };
    const sparks: Spark[] = [];
    sparkLayer.textContent = "";
    const rnd = seeded(7);
    // Telefonda uchqunlar yarmi — ekran kichik, protsessor esa kuchsizroq
    const sparkShare = window.innerWidth < 768 ? 0.5 : 1;
    RIBBONS.forEach((rb, ri) => {
      const path = mainPaths[ri];
      if (!path) return;
      const total = Math.round(rb.sparks * sparkShare);
      for (let k = 0; k < total; k++) {
        const t = (k + 0.5) / total + (rnd() - 0.5) * 0.03;
        const pt = path.getPointAtLength(clamp01(t) * lengths[ri]);
        const jx = (rnd() - 0.5) * 70;
        const jy = (rnd() - 0.5) * 70;
        const size = 2 + rnd() * rnd() * 9;
        const el = document.createElement("span");
        el.className = cn("rr-spark", rnd() > 0.72 && "rr-spark-star");
        el.style.left = `${((pt.x + jx) / VB_W) * 100}%`;
        el.style.top = `${((pt.y + jy) / VB_H) * 100}%`;
        el.style.setProperty("--sz", `${size.toFixed(1)}px`);
        el.style.setProperty("--tw", `${(1.6 + rnd() * 2.4).toFixed(2)}s`);
        el.style.setProperty("--td", `${(-rnd() * 4).toFixed(2)}s`);
        el.style.opacity = "0";
        sparkLayer.appendChild(el);
        sparks.push({ el, ribbon: ri, t: clamp01(t), lastO: -1 });
      }
    });

    let W = 1;
    let H = 1;
    let cardScale = 1;
    let target = 0;
    let current = 0;
    let drawn = -1;
    let raf = 0;
    let running = false;

    function measure() {
      const r = stage!.getBoundingClientRect();
      W = r.width || 1;
      H = r.height || 1;
      const mobile = window.innerWidth < 768;
      const scale = mobile
        ? Math.min((W * 0.94) / CARD_W, (H * 0.42) / CARD_H)
        : Math.min((W * 0.62) / CARD_W, (H * 0.6) / CARD_H, 1.25);
      cardScale = Math.max(0.3, scale);
      scaler!.style.setProperty("--card-scale", String(cardScale));
    }

    // Animatsiya bo'lim ekranga kira boshlaganda boshlanadi (yopishib qolishidan oldin),
    // shuning uchun varaq tushayotganda tepada bo'sh sahna ko'rinmaydi
    function progress() {
      const rect = root!.getBoundingClientRect();
      const lead = window.innerHeight * REVEAL_LEAD;
      const total = rect.height - window.innerHeight + lead;
      return total > 0 ? clamp01((lead - rect.top) / total) : 0;
    }

    function apply(p: number) {
      // varaq yuqoridan tushayotganda sahna chetida "kesilgandek" ko'rinmasin — asta paydo bo'ladi
      if (center) center.style.opacity = isStatic ? "1" : String(Math.round(clamp01((p - 0.06) / 0.1) * 20) / 20);
      for (const { el, frames, basis } of kfEls) {
        const v = sample(frames, p);
        // varaq masshtablangan konteyner ichida — ekran bo'yicha siljishni qaytarib hisoblaymiz
        const inScaler = el.dataset.rk === "card" || el.dataset.rk === "flash" || el.dataset.rk === "rim";
        const bw = basis === "card" ? CARD_W : inScaler ? W / cardScale : W;
        const bh = basis === "card" ? CARD_H : inScaler ? H / cardScale : H;
        el.style.transform =
          `translate3d(${((v.x ?? 0) * bw).toFixed(1)}px, ${((v.y ?? 0) * bh).toFixed(1)}px, 0)` +
          ` rotateX(${(v.rx ?? 0).toFixed(2)}deg) rotateY(${(v.ry ?? 0).toFixed(2)}deg)` +
          ` rotate(${(v.r ?? 0).toFixed(2)}deg) scale(${(v.s ?? 1).toFixed(4)})`;
        if (v.o !== undefined) el.style.opacity = v.o.toFixed(3);
      }

      for (const c of counts) {
        const v = Math.round(c.to * smooth(rangeT(p, c.range)));
        if (v !== c.last) {
          c.el.textContent = String(v);
          c.last = v;
        }
      }
      for (const r of reveals) {
        r.el.style.clipPath = `inset(-20% ${((1 - rangeT(p, r.range)) * 100).toFixed(2)}% -30% 0)`;
      }
      if (signature) signature.style.strokeDashoffset = (1 - smooth(rangeT(p, REVEAL_TIMES.signature))).toFixed(4);

      // yaltiroq: har bir chiziq bo'ylab bir marta, navbatma-navbat (dash uzunligi 0.07)
      shines.forEach((el, i) => {
        if (!el) return;
        const t = isStatic ? 0 : rangeT(p, [SHINE_FROM + i * 0.04, SHINE_TO + i * 0.04]);
        el.style.opacity = t > 0 && t < 1 ? "0.95" : "0";
        el.style.strokeDashoffset = (0.07 - 1.07 * t).toFixed(4);
      });

      // Oltin chiziqlar chiziladi, uchlarida porlab turgan "kometa"
      RIBBONS.forEach((rb, i) => {
        const t = isStatic ? 1 : rangeT(p, rb.draw);
        const off = (1 - t).toFixed(4);
        for (const path of ribbonGroups[i]) path.style.strokeDashoffset = off;
        const head = heads[i];
        if (head) {
          const on = t > 0.001 && t < 0.999;
          head.style.opacity = on ? "1" : "0";
          if (on && mainPaths[i]) {
            const pt = mainPaths[i].getPointAtLength(t * lengths[i]);
            head.style.transform = `translate3d(${((pt.x / VB_W) * W).toFixed(1)}px, ${((pt.y / VB_H) * H).toFixed(1)}px, 0)`;
          }
        }
      });
      for (const s of sparks) {
        const t = isStatic ? 1 : rangeT(p, RIBBONS[s.ribbon].draw);
        const o = Math.round(clamp01((t - s.t) / 0.05) * 10) / 10;
        if (o !== s.lastO) {
          s.el.style.opacity = String(o);
          s.lastO = o;
        }
      }

      for (const { el, key } of texts) {
        const o = isStatic ? (key === "outro" ? 1 : 0) : windowOpacity(p, REVEAL_TIMES[key], key === "intro", key === "outro");
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - o) * 12).toFixed(1)}px, 0)`;
        el.style.visibility = o < 0.02 ? "hidden" : "visible";
      }
    }

    function tick() {
      current += (target - current) * STORY_EASE;
      if (Math.abs(target - current) < 0.0002) current = target;
      if (current !== drawn) {
        apply(current);
        drawn = current;
      }
      if (current !== target) raf = requestAnimationFrame(tick);
      else running = false;
    }

    function onScroll() {
      if (isStatic) return;
      target = progress();
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    }

    let resizeTimer = 0;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        measure();
        apply(current);
      }, 150);
    }

    // Uchqunlar faqat bo'lim ko'rinib turganda "miltillaydi"
    const io = new IntersectionObserver(([entry]) => root.classList.toggle("rr-live", entry.isIntersecting));
    io.observe(root);

    measure();
    target = current = isStatic ? 1 : progress();
    apply(current);
    drawn = current;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
      cancelAnimationFrame(raf);
    };
  }, [mode]);

  return (
    <section
      ref={rootRef}
      className="rr"
      data-mode={mode}
      aria-label="Natija varaqasi"
      style={
        {
          "--rr-h-d": `${REVEAL_HEIGHT.desktop}vh`,
          "--rr-h-m": `${REVEAL_HEIGHT.mobile}vh`,
        } as React.CSSProperties
      }
    >
      <div className="rr-stage" data-rstage>
        {/* Oltin chiziqlar */}
        <svg className="rr-ribbons" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="rr-gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={VB_W} y2="0">
              <stop offset="0" stopColor="#7a4c14" />
              <stop offset="0.28" stopColor="#e7b75a" />
              <stop offset="0.5" stopColor="#fff2c8" />
              <stop offset="0.72" stopColor="#e0a84a" />
              <stop offset="1" stopColor="#8a5a1c" />
            </linearGradient>
          </defs>
          {RIBBONS.map((rb, i) => (
            <g key={i}>
              {/* porlash: keng va shaffof → ingichka va yorqin */}
              <path data-ribbon={i} d={rb.d} className="rr-line" pathLength={1} style={{ strokeWidth: rb.width * 10, opacity: 0.1 }} />
              <path data-ribbon={i} d={rb.d} className="rr-line" pathLength={1} style={{ strokeWidth: rb.width * 3.6, opacity: 0.32 }} />
              <path data-ribbon={i} d={rb.d} className="rr-line" pathLength={1} style={{ strokeWidth: rb.width, opacity: 1 }} />
              {/* markazdagi oppoq "issiq" nur — chiziqqa hajm beradi */}
              <path data-ribbon={i} d={rb.d} className="rr-line rr-core" pathLength={1} style={{ strokeWidth: rb.width * 0.38 }} />
              {/* chizilib bo'lgach skroll bilan chiziq bo'ylab yugurib o'tadigan yaltiroq */}
              <path data-shine={i} d={rb.d} className="rr-shine" pathLength={1} style={{ strokeWidth: rb.width * 1.7 }} />
              {rb.twins.map((dy) => (
                <path
                  key={dy}
                  data-ribbon={i}
                  d={rb.d}
                  className="rr-line"
                  pathLength={1}
                  transform={`translate(${dy * 0.6} ${dy})`}
                  style={{ strokeWidth: 0.8, opacity: 0.55 }}
                />
              ))}
            </g>
          ))}
        </svg>
        <div className="rr-sparks" data-sparks aria-hidden />
        {RIBBONS.map((_, i) => (
          <span key={i} data-head className="rr-head" aria-hidden />
        ))}

        {/* Matnlar */}
        <div data-rtext="intro" className="rr-text rr-text-top">
          <p className="eyebrow justify-center">
            <span className="h-px w-6 bg-brand-400" aria-hidden />
            Sizning natijangiz
          </p>
          <h2 className="display-title mt-3 text-[34px] sm:text-[52px]">Varaqni aylantiring</h2>
        </div>
        <div data-rtext="outro" className="rr-text rr-text-bottom" style={{ opacity: 0, visibility: "hidden" }}>
          <p className="rr-hand-title">Har bir urinish — yangi varaq.</p>
          <Link href="/login" className="story-btn story-btn-primary mt-4">
            Birinchi varaqni boshlash
          </Link>
        </div>

        {/* Varaq */}
        <div className="rr-center" data-rcenter>
          <div data-rscaler className="rr-scaler">
            <div data-rk="shadow" data-basis="card" className="rr-shadow" aria-hidden />
            {/* varaq atrofidagi oltin nur: 3D varaqdan tashqarida, alohida qatlam (bir marta chiziladi) */}
            <div data-rk="rim" className="rr-rim" style={{ opacity: 0 }} aria-hidden />
            <div data-rk="flash" className="rr-flash" aria-hidden />
            <div
              data-rk="card"
              className="rr-card"
              style={{ transform: "translate3d(0,-110vh,0) rotateX(42deg) rotateY(180deg) rotate(-16deg) scale(0.74)" }}
            >
              <CardBack />
              <CardFront />
            </div>
          </div>
        </div>
      </div>
      <noscript>
        <style>{NOSCRIPT_CSS}</style>
      </noscript>
    </section>
  );
}

/* ============================================================================
   Varaqning ikki tomoni
   ============================================================================ */
function CardBack() {
  return (
    <div className="rr-face rr-back" aria-hidden>
      <div className="rr-back-frame" />
      <svg className="rr-guilloche rr-guilloche-gold" viewBox="0 0 680 460" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 18 }, (_, i) => (
          <ellipse key={i} cx="340" cy="230" rx={60 + i * 16} ry={34 + i * 11} transform={`rotate(${i * 9} 340 230)`} />
        ))}
      </svg>
      <LogoSeal size={124} className="rr-monogram" />
      <p className="rr-back-title">{REVEAL_RESULT.brand}</p>
      <p className="rr-back-sub">{REVEAL_RESULT.form} · {REVEAL_RESULT.exam}</p>
    </div>
  );
}

function CardFront() {
  const r = REVEAL_RESULT;
  return (
    <div className="rr-face rr-front" aria-hidden>
      <svg className="rr-guilloche" viewBox="0 0 680 460" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 14 }, (_, i) => (
          <ellipse key={i} cx="520" cy="300" rx={40 + i * 14} ry={26 + i * 9} transform={`rotate(${i * 11} 520 300)`} />
        ))}
      </svg>

      <div className="flex items-start justify-between">
        <div>
          <p className="rr-brand">
            LevelX <span>English</span>
          </p>
          <p className="rr-caps mt-1 tracking-[0.3em]">{r.form}</p>
        </div>
        <div className="text-right">
          <p className="rr-caps">{r.exam}</p>
          <p className="rr-small mt-1">{r.ref}</p>
          <span className="story-sample">{r.sample}</span>
        </div>
      </div>
      <div className="rr-rule mt-3" />

      <div className="mt-4 grid grid-cols-[1.6fr_0.7fr_1fr] gap-4">
        <div>
          <p className="rr-label">Nomzod / Candidate</p>
          <div className="rr-field">
            <span data-rreveal="name" className="rr-hand rr-hand-blue" style={{ clipPath: "inset(0 100% 0 0)" }}>
              {r.name}
            </span>
          </div>
        </div>
        <div>
          <p className="rr-label">Sana</p>
          <p className="rr-value">{r.date}</p>
        </div>
        <div>
          <p className="rr-label">Markaz</p>
          <p className="rr-value">{r.centre}</p>
        </div>
      </div>

      <p className="rr-label mt-5">Natijalar / Test results</p>
      <div className="rr-scores mt-2">
        {r.scores.map((s) => (
          <div key={s.key} className="rr-box">
            <span className="rr-box-label">{s.label}</span>
            <span className="rr-box-value" data-rcount={s.key}>
              {s.value}
            </span>
          </div>
        ))}
        <div className="rr-box rr-box-overall">
          <span className="rr-box-label">Overall</span>
          <span className="rr-box-value" data-rcount="overall">
            {r.overall}
          </span>
        </div>
        <div className="rr-box rr-box-level">
          <span className="rr-box-label">CEFR</span>
          <div data-rk="stamp" className="rr-stamp" style={{ opacity: 0 }}>
            {r.level}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="rr-label">Izoh / Comments</p>
          <div className="rr-field rr-field-note">
            <span data-rreveal="comment" className="rr-hand rr-hand-red" style={{ clipPath: "inset(0 100% 0 0)" }}>
              {r.comment}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-center">
          <svg className="rr-sign" viewBox="0 0 150 44" aria-hidden>
            <path
              data-rsign
              d="M4 30 C 14 6, 22 40, 30 22 S 44 8, 48 28 S 60 36, 66 20 C 70 10, 76 34, 86 24 C 96 14, 104 30, 118 18 C 126 12, 134 20, 146 14"
              pathLength={1}
              style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
            />
          </svg>
          <div className="rr-rule" />
          <p className="rr-small mt-1">Imzo</p>
        </div>
      </div>
    </div>
  );
}
