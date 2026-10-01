"use client";

import { useT } from "@/i18n/client";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { ArrowRight, BookOpen, Check, Edit3, Headphones, Mic, Star, Zap } from "react-feather";
import type { SiteStats } from "@/lib/home";
import {
  COUNTS,
  DRAWS,
  FLOATERS,
  HIGHLIGHTS,
  KEYFRAMES,
  REVEALS,
  STORY_EASE,
  STORY_HEIGHT,
  STORY_AURORA,
  glowBackground,
  storyChapters,
  heroProof,
  type Floater,
  type Keyframe,
  type Range,
  type StoryChapter,
} from "@/lib/home-story";
import { cn } from "@/lib/format";
import { StorySheet } from "./StorySheet";
import { useMotionMode } from "./motion";

/* ============================================================================
   Yordamchi matematika
   ============================================================================ */
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => t * t * (3 - 2 * t);
const rangeT = (p: number, [a, b]: Range) => clamp01((p - a) / (b - a));

/** Kalit kadrlar orasida silliq interpolyatsiya */
function sample(frames: Keyframe[], p: number) {
  const keys = ["x", "y", "r", "rx", "ry", "s", "o"] as const;
  const out: Record<(typeof keys)[number], number | undefined> = {
    x: undefined, y: undefined, r: undefined, rx: undefined, ry: undefined, s: undefined, o: undefined,
  };
  for (const k of keys) {
    // shu xususiyat berilgan kadrlarni olamiz
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

/** Oraliq ichida ko'rinish: har uchida `edge` ulushida paydo bo'ladi/yo'qoladi */
function windowOpacity(p: number, [a, b]: Range, edge: number, openStart = false, openEnd = false) {
  const len = b - a;
  const e = len * edge;
  if (p < a) return openStart ? 1 : 0;
  if (p > b) return openEnd ? 1 : 0;
  const fin = openStart ? 1 : clamp01((p - a) / e);
  const fout = openEnd ? 1 : clamp01((b - p) / e);
  return smooth(Math.min(fin, fout));
}

function countValue(p: number, segments: { range: Range; from: number; to: number }[]) {
  let v = 0;
  for (const seg of segments) {
    if (p >= seg.range[0]) v = seg.from + (seg.to - seg.from) * smooth(rangeT(p, seg.range));
  }
  return Math.round(v);
}

/* ============================================================================
   Komponent
   ============================================================================ */
export function HomeStory({ stats }: { stats: SiteStats }) {
  const t = useT();
  const chapters = useMemo(() => storyChapters(stats, t), [stats, t]);
  const proof = useMemo(() => heroProof(stats, t), [stats, t]);
  const rootRef = useRef<HTMLElement>(null);
  // "static" — harakatsiz variant (reduced motion, sekin internet, kam xotira)
  const mode = useMotionMode();

  // Animatsiya dvigateli
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scene = root.querySelector<HTMLElement>("[data-scene]");
    const scaler = root.querySelector<HTMLElement>("[data-scaler]");
    if (!scene || !scaler) return;

    const q = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T & HTMLElement>(sel));
    const kfEls = q("[data-kf]").map((el) => ({
      el,
      frames: KEYFRAMES[el.dataset.kf!] ?? [],
      basis: el.dataset.basis,
      quantize: el.dataset.kf!.startsWith("aurora"),
      lastO: -1,
    }));
    const chapterEls = q("[data-chapter]").map((el) => ({ el, i: Number(el.dataset.chapter) }));
    const floatEls = q("[data-float]").map((el) => ({ el, f: FLOATERS[Number(el.dataset.float)] }));
    const countEls = q("[data-count]").map((el) => ({ el, key: el.dataset.count as keyof typeof COUNTS, last: -1 }));
    const barEls = q("[data-bar]").map((el) => ({ el, key: el.dataset.bar as keyof typeof COUNTS }));
    const hlEls = q("[data-hl]").map((el) => ({ el, range: HIGHLIGHTS[el.dataset.hl as keyof typeof HIGHLIGHTS] }));
    const revealEls = q("[data-reveal]").map((el) => ({ el, key: el.dataset.reveal as keyof typeof REVEALS, width: 0 }));
    const penEls = q("[data-pen]").map((el) => ({ el, key: el.dataset.pen as keyof typeof REVEALS }));
    const drawEls = q<SVGPathElement>("[data-draw]").map((el) => ({ el, range: DRAWS[el.getAttribute("data-draw") as keyof typeof DRAWS] }));

    const isStatic = mode === "static";
    let W = 1;
    let H = 1;
    let target = 0;
    let current = 0;
    let drawn = -1;
    let raf = 0;
    let running = false;

    const SHEET_W = 440;
    let SHEET_H = 680;
    const sheetEl = root.querySelector<HTMLElement>("[data-kf='sheet']");

    function measure() {
      const rect = scene!.getBoundingClientRect();
      W = rect.width || 1;
      H = rect.height || 1;
      SHEET_H = sheetEl?.offsetHeight || SHEET_H;
      const mobile = window.innerWidth < 768;
      const scale = Math.min((W * (mobile ? 0.66 : 0.78)) / SHEET_W, (H * 0.94) / SHEET_H, 1.12);
      scaler!.style.setProperty("--sheet-scale", String(Math.max(0.4, scale)));
      for (const r of revealEls) r.width = r.el.scrollWidth;
    }

    function progressFromScroll() {
      const rect = root!.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      return total > 0 ? clamp01(-rect.top / total) : 0;
    }

    function apply(p: number) {
      // 1) Kalit kadrli elementlar (varaqa, soya, muhrlar...)
      for (const k of kfEls) {
        const { el, frames, basis } = k;
        if (frames.length === 0) continue;
        const v = sample(frames, p);
        // Fon qatlamlari butun ekranni egallaydi — ularni har kadrda emas,
        // faqat sezilarli o'zgarganda yangilaymiz (arzon telefonlar uchun)
        if (k.quantize) {
          const o = Math.round((v.o ?? 1) / 0.04) * 0.04;
          if (o !== k.lastO) {
            el.style.opacity = o.toFixed(2);
            k.lastO = o;
          }
          continue;
        }
        const bw = basis === "sheet" ? SHEET_W : W;
        const bh = basis === "sheet" ? SHEET_H : H;
        el.style.transform =
          `translate3d(${((v.x ?? 0) * bw).toFixed(2)}px, ${((v.y ?? 0) * bh).toFixed(2)}px, 0)` +
          ` rotateX(${(v.rx ?? 0).toFixed(2)}deg) rotateY(${(v.ry ?? 0).toFixed(2)}deg)` +
          ` rotate(${(v.r ?? 0).toFixed(2)}deg) scale(${(v.s ?? 1).toFixed(4)})`;
        if (v.o !== undefined) el.style.opacity = v.o.toFixed(3);
      }

      // 2) Matn bloklari
      const last = chapters.length - 1;
      for (const { el, i } of chapterEls) {
        const ch = chapters[i];
        const o = isStatic ? (i === 0 ? 1 : 0) : windowOpacity(p, ch.range, 0.15, i === 0, i === last);
        // kirishda pastdan, chiqishda tepaga 12px
        const mid = (ch.range[0] + ch.range[1]) / 2;
        const dir = p < mid ? 1 : -1;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - o) * 12 * dir).toFixed(2)}px, 0)`;
        el.style.visibility = o < 0.02 ? "hidden" : "visible";
      }

      // 3) Suzuvchi elementlar: parallaks + ko'rinish oralig'i
      for (const { el, f } of floatEls) {
        const o = windowOpacity(p, f.show, 0.18, f.show[0] <= 0, f.show[1] >= 1);
        const y = (0.5 - p) * f.depth * H * 0.9;
        const r = f.rot + (p - 0.5) * f.depth * 16;
        // ko'rinmaydigan elementlar umuman chizilmaydi (idle animatsiyasi ham to'xtaydi)
        const hidden = o < 0.02;
        el.style.display = hidden ? "none" : "";
        if (hidden) continue;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg) scale(${(0.9 + o * 0.1).toFixed(3)})`;
      }

      // 4) Sanaladigan ballar va chiziqlar
      const values: Record<string, number> = {};
      for (const c of countEls) {
        const v = countValue(p, COUNTS[c.key]);
        values[c.key] = v;
        if (v !== c.last) {
          c.el.textContent = String(v);
          c.last = v;
        }
      }
      for (const { el, key } of barEls) {
        const v = values[key] ?? countValue(p, COUNTS[key]);
        el.style.transform = `scaleX(${(v / 75).toFixed(3)})`;
      }
      for (const { el, range } of hlEls) {
        el.style.opacity = (isStatic ? 0 : windowOpacity(p, range, 0.2)).toFixed(3);
      }

      // 5) Qo'lyozma: chapdan o'ngga ochiladi, ruchka uchi yozuv chetida yuradi
      const revealT: Record<string, number> = {};
      for (const r of revealEls) {
        const t = rangeT(p, REVEALS[r.key]);
        revealT[r.key] = t;
        r.el.style.clipPath = `inset(-20% ${((1 - t) * 100).toFixed(2)}% -30% 0)`;
      }
      for (const { el, key } of penEls) {
        const frames = KEYFRAMES[key === "name" ? "pen" : "redPen"];
        const v = sample(frames, p);
        const t = revealT[key] ?? 0;
        const width = revealEls.find((r) => r.key === key)?.width ?? 0;
        const wiggle = Math.sin(t * 46) * 2.2 * (t > 0 && t < 1 ? 1 : 0);
        el.style.transform =
          `translate3d(${((v.x ?? 0) * SHEET_W + t * width).toFixed(1)}px, ${((v.y ?? 0) * SHEET_H + wiggle).toFixed(1)}px, 0) rotate(${(v.r ?? 0).toFixed(2)}deg)`;
        el.style.opacity = (isStatic ? 0 : (v.o ?? 0)).toFixed(3);
      }

      // 6) Chiziladigan SVG yo'llar
      for (const { el, range } of drawEls) {
        el.style.strokeDashoffset = (1 - smooth(rangeT(p, range))).toFixed(4);
      }
    }

    function tick() {
      current += (target - current) * STORY_EASE;
      if (Math.abs(target - current) < 0.0002) current = target;
      // faqat sezilarli o'zgarishda chizamiz
      if (Math.abs(current - drawn) > 0.00025 || current === target) {
        if (current !== drawn) apply(current);
        drawn = current;
      }
      if (current !== target) raf = requestAnimationFrame(tick);
      else running = false;
    }

    function kick() {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    }

    function onScroll() {
      if (isStatic) return;
      target = progressFromScroll();
      kick();
    }

    let resizeTimer = 0;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        measure();
        apply(isStatic ? 1 : current);
      }, 150);
    }

    measure();
    // Sahifa o'rtasidan qayta yuklansa — silliqlashsiz darhol joyiga
    target = current = isStatic ? 1 : progressFromScroll();
    apply(current);
    drawn = current;
    root.dataset.ready = "1";

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Qo'lyozma shrifti keyin yuklanadi — kengligini qayta o'lchaymiz
    void document.fonts?.ready.then(() => {
      measure();
      apply(current);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
      cancelAnimationFrame(raf);
    };
  }, [mode, chapters]);

  return (
    <section
      ref={rootRef}
      className="story"
      data-mode={mode}
      aria-label={t("levelxenglish — natija varaqasi", "levelxenglish — result sheet")}
      style={
        {
          "--story-h-d": `${STORY_HEIGHT.desktop}vh`,
          "--story-h-m": `${STORY_HEIGHT.mobile}vh`,
        } as React.CSSProperties
      }
    >
      <div className="story-stage">
        <div data-kf="auroraA" className="story-aurora" style={{ backgroundImage: glowBackground(STORY_AURORA.a) }} aria-hidden />
        <div
          data-kf="auroraB"
          className="story-aurora"
          style={{ backgroundImage: glowBackground(STORY_AURORA.b), opacity: 0.1 }}
          aria-hidden
        />
        <div className="container-page story-grid">
          {/* ------------------------------------------------ Matn */}
          <div className="story-text">
            {chapters.map((ch, i) => (
              <ChapterBlock key={ch.id} chapter={ch} index={i} proof={proof} />
            ))}
          </div>

          {/* ------------------------------------------------ Sahna: varaqa va atrofi */}
          <div className="story-scene" data-scene>
            {FLOATERS.map((f, i) => (
              <FloaterEl key={f.id} floater={f} index={i} />
            ))}
            <div data-scaler className="story-scaler">
              <div data-kf="shadow" data-basis="sheet" className="story-shadow" />
              <div data-kf="sheet" className="story-sheet" style={{ transform: "rotateX(26deg) rotateY(-20deg) rotate(-9deg) scale(0.9)" }}>
                <StorySheet />
              </div>
            </div>
          </div>
        </div>

        <div data-kf="hint" className="story-hint" aria-hidden>
          <span>{t("Pastga suring", "Scroll down")}</span>
          <i />
        </div>
      </div>

      {/* Harakatsiz variantda qolgan bo'limlar oddiy ro'yxat bo'lib chiqadi */}
      {mode === "static" ? <StaticChapters chapters={chapters.slice(1)} /> : null}

      {/* JavaScript o'chiq bo'lsa: uzun bo'sh skroll o'rniga oddiy sahifa */}
      <noscript>
        <style>{`.story{height:auto!important}.story-stage{position:relative!important}.story-hint{display:none!important}`}</style>
        <StaticChapters chapters={chapters.slice(1)} />
      </noscript>
    </section>
  );
}

/* ============================================================================
   Qismlar
   ============================================================================ */
function ChapterBlock({ chapter, index, proof }: { chapter: StoryChapter; index: number; proof: string[] }) {
  if (chapter.hero) return <HeroBlock chapter={chapter} proof={proof} />;
  return (
    <div
      data-chapter={index}
      className="story-chapter"
      style={index === 0 ? undefined : { opacity: 0, visibility: "hidden" }}
    >
      <p className="eyebrow">
        <span className="h-px w-6 bg-brand-400" aria-hidden />
        {chapter.eyebrow}
      </p>
      <h2 className="display-title story-title">{chapter.title}</h2>
      <p className="story-body">{chapter.body}</p>
      {chapter.cta ? <ChapterButtons cta={chapter.cta} /> : null}
    </div>
  );
}

function ChapterButtons({ cta }: { cta: NonNullable<StoryChapter["cta"]> }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href={cta.primary.href} className="story-btn story-btn-primary group">
        {cta.primary.label}
        <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden />
      </Link>
      {cta.secondary ? (
        <Link href={cta.secondary.href} className="story-btn story-btn-ghost">
          <Star size={15} aria-hidden />
          {cta.secondary.label}
        </Link>
      ) : null}
    </div>
  );
}

/** Hero: nishon, ajratilgan so'zli sarlavha, qo'lyozma shior, tugmalar va haqiqiy sonlar */
function HeroBlock({ chapter, proof }: { chapter: StoryChapter; proof: string[] }) {
  const t = useT();
  const hl = chapter.highlight;
  const at = hl ? chapter.title.indexOf(hl) : -1;
  const before = at >= 0 ? chapter.title.slice(0, at) : chapter.title;
  const after = at >= 0 ? chapter.title.slice(at + hl!.length) : "";
  return (
    <div data-chapter={0} className="story-chapter story-hero">
      <span className="hero-pill">
        <i aria-hidden />
        {chapter.eyebrow}
      </span>
      <h1 className="display-title story-title story-title-hero">
        {before}
        {at >= 0 ? (
          <em className="hero-em">
            {hl}
            <svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden>
              <path d="M4 16 C 60 6, 130 20, 190 10 S 280 8, 296 14" pathLength={1} />
            </svg>
          </em>
        ) : null}
        {after}
      </h1>
      <p className="hero-hand">Push Past Your Limits</p>
      <p className="story-body">{chapter.body}</p>
      {chapter.cta ? <ChapterButtons cta={chapter.cta} /> : null}
      <ul className="hero-proof" aria-label={t("Platforma haqida", "About the platform")}>
        {proof.map((item) => (
          <li key={item}>
            <Check size={13} strokeWidth={2.5} aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const CHIP_ICONS = { headphones: Headphones, book: BookOpen, pen: Edit3, mic: Mic, spark: Zap };

function FloaterEl({ floater: f, index }: { floater: Floater; index: number }) {
  const Icon = f.icon ? CHIP_ICONS[f.icon] : null;
  const visibleAtStart = f.show[0] <= 0;
  const t = useT();
  const text = typeof f.text === "string" ? f.text : t(f.text);
  const sub = f.sub === undefined ? undefined : typeof f.sub === "string" ? f.sub : t(f.sub);
  return (
    <div
      data-float={index}
      className={cn(
        "story-float",
        `story-float-${f.kind}`,
        !f.mobile && "story-desktop-only",
        f.minWidth && `story-float-min${f.minWidth}`,
      )}
      style={
        {
          left: `${f.at[0]}%`,
          top: `${f.at[1]}%`,
          "--mx": `${(f.atMobile ?? f.at)[0]}%`,
          "--my": `${(f.atMobile ?? f.at)[1]}%`,
          display: visibleAtStart ? undefined : "none",
          transform: `rotate(${f.rot}deg)`,
        } as React.CSSProperties
      }
      aria-hidden
    >
      <div className="story-bob" style={{ animationDelay: `${-index * 1.3}s` }}>
        {f.kind === "chip" && Icon ? (
          <>
            <span className="story-chip-icon">
              <Icon size={15} strokeWidth={1.8} />
            </span>
            <span>
              <b>{text}</b>
              {sub ? <small>{sub}</small> : null}
            </span>
          </>
        ) : f.kind === "card" ? (
          <>
            <b>{text}</b>
            <small>{sub}</small>
          </>
        ) : f.kind === "note" ? (
          <>
            <b>{text}</b>
            <small>{sub}</small>
          </>
        ) : f.kind === "word" ? (
          <>
            {text}
            <svg viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden>
              <path d="M2 8 C 30 3, 60 11, 118 5" />
            </svg>
          </>
        ) : (
          text
        )}
      </div>
    </div>
  );
}

function StaticChapters({ chapters }: { chapters: StoryChapter[] }) {
  return (
    <div className="container-page grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
      {chapters.map((ch) => (
        <div key={ch.id} className="card-glass rounded-2xl p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">{ch.eyebrow}</p>
          <h2 className="display-title mt-2 text-2xl">{ch.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{ch.body}</p>
          {ch.cta ? (
            <Link href={ch.cta.primary.href} className="story-btn story-btn-primary mt-5 inline-flex">
              {ch.cta.primary.label}
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}
