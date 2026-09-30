"use client";

import { useT } from "@/i18n/client";
import { useEffect, useRef, type ReactNode } from "react";
import {
  CERT,
  CERT_H,
  CERT_HEIGHT,
  CERT_KEYFRAMES,
  CERT_REST,
  CERT_TIMES,
  CERT_W,
  ORBITS,
  orbitPath,
  type Orbit,
} from "@/lib/cert-scene";
import { STORY_EASE } from "@/lib/home-story";
import { cn } from "@/lib/format";
import { Highlight } from "@/components/motion/Highlight";
import { LogoSeal } from "./LogoSeal";
import { clamp01, rangeT, sample, seeded, smooth, useMotionMode } from "./motion";

/** Orbitalar chiziladigan SVG maydoni: sertifikatdan har tomonga kengroq */
const PAD_X = 200;
const PAD_Y = 150;
const VIEW = `${-PAD_X} ${-PAD_Y} ${CERT_W + PAD_X * 2} ${CERT_H + PAD_Y * 2}`;

/** Nuqta halqaning "old" yarmidami (sertifikat ustidan o'tadi) */
function isFront(o: Orbit, x: number, y: number) {
  const t = (o.tilt * Math.PI) / 180;
  return -(x - CERT_W / 2) * Math.sin(t) + (y - CERT_H / 2) * Math.cos(t) > 0;
}

/** Halqaning old/orqa yarmini kesib oluvchi yarim tekislik (og'ish burchagi bo'yicha) */
function HalfClip({ id, o, front }: { id: string; o: Orbit; front: boolean }) {
  const cx = CERT_W / 2;
  const cy = CERT_H / 2;
  return (
    <clipPath id={id}>
      <rect x={cx - 3000} y={front ? cy : cy - 3000} width={6000} height={3000} transform={`rotate(${o.tilt} ${cx} ${cy})`} />
    </clipPath>
  );
}

const NOSCRIPT_CSS = [
  ".cr{height:auto!important}",
  ".cr-stage{position:relative!important}",
  ".cr-line{stroke-dashoffset:0!important}",
  ".cr-orbits{opacity:.7!important}",
  "[data-ck=card]{transform:rotate(-1.5deg)!important}",
  "[data-ck=level],[data-ck=rim]{opacity:1!important;transform:none!important}",
  "[data-creveal]{clip-path:none!important}",
  "[data-cscale]{transform:none!important}",
  "[data-csign]{stroke-dashoffset:0!important}",
  ".cr-rung{opacity:1!important}",
].join("");

export function CertReveal({
  eyebrow,
  title,
  highlight,
  hand,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  hand?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const t = useT();
  const rootRef = useRef<HTMLElement>(null);
  const mode = useMotionMode();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const isStatic = mode === "static";
    const q = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
    const stage = root.querySelector<HTMLElement>("[data-cstage]")!;
    const scene = root.querySelector<HTMLElement>("[data-cscene]")!;
    const scaler = root.querySelector<HTMLElement>("[data-cscaler]")!;
    const orbitsEls = q<SVGSVGElement>(".cr-orbits");
    const kfEls = q("[data-ck]").map((el) => ({ el, frames: CERT_KEYFRAMES[el.dataset.ck!] ?? [] }));
    const lines = ORBITS.map((_, i) => q<SVGPathElement>(`[data-orbit="${i}"]`));
    const mains = lines.map((g) => g[0]);
    const lengths = mains.map((p) => p?.getTotalLength() ?? 1);
    const heads = q("[data-chead]");
    const reveals = q("[data-creveal]").map((el) => ({ el, range: CERT_TIMES[el.dataset.creveal as "name"] }));
    const scaleFill = root.querySelector<HTMLElement>("[data-cscale]");
    const sign = root.querySelector<SVGPathElement>("[data-csign]");
    const rungs = q("[data-rung]");

    // Uchqunlar: orbitalar bo'ylab (oldingi yarmi sertifikat ustida, orqadagisi ortida)
    type Spark = { el: HTMLElement; orbit: number; t: number; lastO: number };
    const sparks: Spark[] = [];
    const front = root.querySelector<HTMLElement>("[data-csparks=front]")!;
    const back = root.querySelector<HTMLElement>("[data-csparks=back]")!;
    front.textContent = "";
    back.textContent = "";
    const rnd = seeded(11);
    const share = window.innerWidth < 768 ? 0.5 : 1;
    ORBITS.forEach((o, oi) => {
      const path = mains[oi];
      if (!path) return;
      const total = Math.round(o.sparks * share);
      for (let k = 0; k < total; k++) {
        const t = clamp01((k + 0.5) / total + (rnd() - 0.5) * 0.03);
        const pt = path.getPointAtLength(t * lengths[oi]);
        const x = pt.x + (rnd() - 0.5) * 40;
        const y = pt.y + (rnd() - 0.5) * 40;
        const el = document.createElement("span");
        el.className = cn("rr-spark", rnd() > 0.7 && "rr-spark-star");
        el.style.left = `${((x + PAD_X) / (CERT_W + PAD_X * 2)) * 100}%`;
        el.style.top = `${((y + PAD_Y) / (CERT_H + PAD_Y * 2)) * 100}%`;
        el.style.setProperty("--sz", `${(2 + rnd() * rnd() * 8).toFixed(1)}px`);
        el.style.setProperty("--tw", `${(1.6 + rnd() * 2.4).toFixed(2)}s`);
        el.style.setProperty("--td", `${(-rnd() * 4).toFixed(2)}s`);
        el.style.opacity = "0";
        (isFront(o, pt.x, pt.y) ? front : back).appendChild(el);
        sparks.push({ el, orbit: oi, t, lastO: -1 });
      }
    });

    let W = 1;
    let H = 1;
    let target = 0;
    let current = 0;
    let drawn = -1;
    let raf = 0;
    let running = false;
    let lastPower = -1;

    function measure() {
      const r = scene.getBoundingClientRect();
      W = r.width || 1;
      H = r.height || 1;
      // orbitalar bilan birga sig'ishi kerak: kengligi ~750px, balandligi ~660px (masshtabsiz)
      const s = Math.min((W * 1.02) / 750, (H * 0.9) / 660, 1.15);
      scaler.style.setProperty("--cs", String(Math.max(0.3, s)));
    }

    function progress() {
      const rect = root!.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      return total > 0 ? clamp01(-rect.top / total) : 0;
    }

    function apply(p: number) {
      for (const { el, frames } of kfEls) {
        const v = sample(frames, p);
        const y = (v.y ?? 0) * CERT_H;
        el.style.transform =
          `translate3d(0, ${y.toFixed(1)}px, 0) rotateX(${(v.rx ?? 0).toFixed(2)}deg) rotateY(${(v.ry ?? 0).toFixed(2)}deg)` +
          ` rotate(${(v.r ?? 0).toFixed(2)}deg) scale(${(v.s ?? 1).toFixed(4)})`;
        if (v.o !== undefined) el.style.opacity = v.o.toFixed(3);
      }
      ORBITS.forEach((o, i) => {
        const t = isStatic ? 1 : rangeT(p, o.draw);
        const off = (1 - t).toFixed(4);
        for (const path of lines[i]) path.style.strokeDashoffset = off;
        const head = heads[i];
        if (!head) return;
        const on = t > 0.001 && t < 0.999;
        head.style.opacity = on ? "1" : "0";
        if (on && mains[i]) {
          const pt = mains[i].getPointAtLength(t * lengths[i]);
          head.style.left = `${((pt.x + PAD_X) / (CERT_W + PAD_X * 2)) * 100}%`;
          head.style.top = `${((pt.y + PAD_Y) / (CERT_H + PAD_Y * 2)) * 100}%`;
          head.style.zIndex = isFront(o, pt.x, pt.y) ? "6" : "1";
        }
      });
      for (const s of sparks) {
        const t = isStatic ? 1 : rangeT(p, ORBITS[s.orbit].draw);
        const op = Math.round(clamp01((t - s.t) / 0.05) * 10) / 10;
        if (op !== s.lastO) {
          s.el.style.opacity = String(op);
          s.lastO = op;
        }
      }
      // oxirida chiziqlar to'xtaydi va yorug'ligi pasayadi
      const power = Math.round((1 - (1 - CERT_REST) * smooth(rangeT(p, CERT_TIMES.settle))) * 20) / 20;
      if (power !== lastPower) {
        for (const svg of orbitsEls) svg.style.opacity = String(power);
        root!.style.setProperty("--cr-power", String(power));
        lastPower = power;
      }
      for (const r of reveals) r.el.style.clipPath = `inset(-20% ${((1 - rangeT(p, r.range)) * 100).toFixed(2)}% -30% 0)`;
      if (scaleFill) scaleFill.style.transform = `scaleX(${smooth(rangeT(p, CERT_TIMES.scale)).toFixed(4)})`;
      if (sign) sign.style.strokeDashoffset = (1 - smooth(rangeT(p, CERT_TIMES.signature))).toFixed(4);
      const lit = rangeT(p, CERT_TIMES.ladder) * CERT.levelIndex;
      rungs.forEach((el, i) => el.classList.toggle("is-lit", isStatic ? i <= CERT.levelIndex : i <= lit + 0.001));
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
    const io = new IntersectionObserver(([e]) => root.classList.toggle("rr-live", e.isIntersecting));
    io.observe(stage);

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
      className="cr"
      data-mode={mode}
      style={{ "--cr-h-d": `${CERT_HEIGHT.desktop}vh`, "--cr-h-m": `${CERT_HEIGHT.mobile}vh` } as React.CSSProperties}
    >
      <div className="cr-stage" data-cstage>
        <div className="ph-bg" aria-hidden />
        <div className="container-page cr-grid">
          {/* ------------------------------------------------ Matn (chapda) */}
          <div className="ph-copy cr-copy">
            <p className="hero-pill">
              <i aria-hidden />
              {eyebrow}
            </p>
            <h1 className="display-title mt-5 text-[36px] sm:text-[52px]">
              <Highlight text={title} word={highlight} />
            </h1>
            {hand ? <p className="hero-hand">{hand}</p> : null}
            {children ? <div className="cr-body mt-4 max-w-xl text-[15px] leading-relaxed text-muted">{children}</div> : null}
            {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
            <div className="cr-ladder" aria-label={t("CEFR darajalari", "CEFR levels")}>
              <p>{t("CEFR yo'lingiz", "Your CEFR path")}</p>
              <ol>
                {CERT.scale.map((lv, i) => (
                  <li key={lv} data-rung className={cn("cr-rung", i === CERT.levelIndex && "cr-rung-goal")}>
                    <span>{lv}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* ------------------------------------------------ 3D sertifikat (o'ngda) */}
          <div className="cr-scene" data-cscene aria-hidden>
            <div className="cr-scaler" data-cscaler>
              <Orbits layer="back" />
              <div className="cr-sparks" data-csparks="back" />
              <div data-ck="shadow" className="cr-shadow" />
              <div data-ck="flash" className="rr-flash cr-flash" style={{ opacity: 0 }} />
              <div data-ck="rim" className="cr-rim" style={{ opacity: 0 }} />
              <div
                data-ck="card"
                className="cr-card"
                style={{ transform: "rotateX(16deg) rotateY(180deg) rotate(8deg) scale(0.9)" }}
              >
                <CertBack />
                <CertFront />
              </div>
              <Orbits layer="front" />
              <div className="cr-sparks cr-sparks-front" data-csparks="front" />
              {ORBITS.map((_, i) => (
                <span key={i} data-chead className="rr-head cr-head" />
              ))}
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
   Oltin orbitalar (orqa yarmi sertifikat ortida, old yarmi ustida)
   ============================================================================ */
function Orbits({ layer }: { layer: "front" | "back" }) {
  const front = layer === "front";
  return (
    <svg className={cn("cr-orbits", front ? "cr-orbits-front" : "cr-orbits-back")} viewBox={VIEW}>
      <defs>
        <linearGradient id={`cr-gold-${layer}`} gradientUnits="userSpaceOnUse" x1={-PAD_X} y1="0" x2={CERT_W + PAD_X} y2="0">
          <stop offset="0" stopColor="#8a5a1c" />
          <stop offset="0.3" stopColor="#e7b75a" />
          <stop offset="0.5" stopColor="#fff2c8" />
          <stop offset="0.7" stopColor="#e0a84a" />
          <stop offset="1" stopColor="#7a4c14" />
        </linearGradient>
        {ORBITS.map((o, i) => (
          <HalfClip key={i} id={`cr-clip-${layer}-${i}`} o={o} front={front} />
        ))}
      </defs>
      {ORBITS.map((o, i) => {
        const d = orbitPath(o);
        const stroke = `url(#cr-gold-${layer})`;
        return (
          <g key={i} clipPath={`url(#cr-clip-${layer}-${i})`}>
            {/* birinchi yo'l — asosiy (uzunlik va uchqunlar shundan olinadi) */}
            <path data-orbit={i} d={d} className="cr-line" pathLength={1} stroke={stroke} style={{ strokeWidth: o.width, opacity: 1 }} />
            <path data-orbit={i} d={d} className="cr-line" pathLength={1} stroke={stroke} style={{ strokeWidth: o.width * 9, opacity: 0.1 }} />
            <path data-orbit={i} d={d} className="cr-line" pathLength={1} stroke={stroke} style={{ strokeWidth: o.width * 3.4, opacity: 0.3 }} />
            <path data-orbit={i} d={d} className="cr-line cr-core" pathLength={1} style={{ strokeWidth: o.width * 0.38 }} />
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================================
   Sertifikatning ikki tomoni
   ============================================================================ */
function CertBack() {
  return (
    <div className="cr-face cr-back">
      <div className="rr-back-frame" />
      <svg className="rr-guilloche rr-guilloche-gold" viewBox={`0 0 ${CERT_W} ${CERT_H}`} preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 16 }, (_, i) => (
          <ellipse key={i} cx={CERT_W / 2} cy={CERT_H / 2} rx={50 + i * 14} ry={70 + i * 17} transform={`rotate(${i * 11} ${CERT_W / 2} ${CERT_H / 2})`} />
        ))}
      </svg>
      <LogoSeal size={132} className="rr-monogram" />
      <p className="rr-back-title">{CERT.brand}</p>
      <p className="rr-back-sub">CEFR Certificate</p>
    </div>
  );
}

function CertFront() {
  const t = useT();
  return (
    <div className="cr-face cr-front">
      <svg className="cr-border" viewBox={`0 0 ${CERT_W} ${CERT_H}`} preserveAspectRatio="none">
        <rect x="14" y="14" width={CERT_W - 28} height={CERT_H - 28} rx="6" />
        <rect x="22" y="22" width={CERT_W - 44} height={CERT_H - 44} rx="4" className="cr-border-thin" />
        {[
          [22, 22, 0],
          [CERT_W - 22, 22, 90],
          [CERT_W - 22, CERT_H - 22, 180],
          [22, CERT_H - 22, 270],
        ].map(([x, y, r]) => (
          <path key={r} d="M0 34 C 0 14, 14 0, 34 0 M8 34 C 8 19, 19 8, 34 8 M0 0 L 12 12" transform={`translate(${x} ${y}) rotate(${r})`} />
        ))}
      </svg>
      <svg className="rr-guilloche" viewBox={`0 0 ${CERT_W} ${CERT_H}`} preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx={CERT_W / 2} cy={CERT_H * 0.62} rx={40 + i * 13} ry={26 + i * 9} transform={`rotate(${i * 13} ${CERT_W / 2} ${CERT_H * 0.62})`} />
        ))}
      </svg>

      <div className="cr-front-inner">
        <span className="cr-sample">{CERT.sample}</span>
        <LogoSeal size={58} />
        <p className="cr-brand">
          LevelX <span>English</span>
        </p>
        <p className="cr-title">{CERT.title}</p>
        <p className="cr-subtitle">{CERT.subtitle}</p>

        <p className="cr-small mt-5">{CERT.certify}</p>
        <div className="cr-name-line">
          <span data-creveal="name" className="rr-hand rr-hand-blue cr-name" style={{ clipPath: "inset(0 100% 0 0)" }}>
            {t(CERT.name)}
          </span>
        </div>
        <p className="cr-small">{CERT.achieved}</p>

        <div className="cr-level">
          <div data-ck="level" className="cr-level-badge" style={{ opacity: 0 }}>
            <span>{CERT.level}</span>
          </div>
          <p className="cr-level-name">
            {CERT.levelName}
            <small>Common European Framework</small>
          </p>
        </div>

        <div className="cr-scale">
          <span data-cscale className="cr-scale-fill" style={{ transform: "scaleX(0)", width: `${((CERT.levelIndex + 1) / CERT.scale.length) * 100}%` }} />
          {CERT.scale.map((lv, i) => (
            <span key={lv} className={cn("cr-scale-cell", i === CERT.levelIndex && "is-goal")}>
              {lv}
            </span>
          ))}
        </div>

        <div className="cr-foot">
          <div>
            <p className="cr-foot-value">{CERT.date}</p>
            <p className="cr-foot-label">{CERT.ref}</p>
          </div>
          <Rosette />
          <div className="text-right">
            <svg className="cr-sign" viewBox="0 0 150 40">
              <path
                data-csign
                d="M4 28 C 14 6, 22 36, 30 20 S 44 8, 48 26 S 62 34, 68 18 C 72 8, 80 32, 90 22 C 100 12, 108 28, 122 16 C 130 10, 138 18, 146 12"
                pathLength={1}
                style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
              />
            </svg>
            <p className="cr-foot-label">{CERT.signer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Oltin rozetka (lentali muhr) */
function Rosette() {
  return (
    <svg className="cr-rosette" viewBox="0 0 80 96">
      <defs>
        <radialGradient id="cr-ros" cx="40%" cy="35%">
          <stop offset="0" stopColor="#fff1cc" />
          <stop offset="0.55" stopColor="#d9ac5f" />
          <stop offset="1" stopColor="#8f6a2e" />
        </radialGradient>
      </defs>
      <path d="M26 58 L16 94 L30 86 L38 96 L42 62 Z" fill="#b8883f" />
      <path d="M54 58 L64 94 L50 86 L42 96 L38 62 Z" fill="#9a6f33" />
      <g transform="translate(40 38)">
        {Array.from({ length: 16 }, (_, i) => (
          <circle key={i} cx={Math.cos((i / 16) * Math.PI * 2) * 25} cy={Math.sin((i / 16) * Math.PI * 2) * 25} r="8" fill="url(#cr-ros)" />
        ))}
        <circle r="25" fill="url(#cr-ros)" />
        <circle r="19" fill="none" stroke="#8f6a2e" strokeWidth="1" opacity="0.6" />
        <text y="6" textAnchor="middle" fontSize="15" fontWeight="700" fill="#6b4c1c" fontFamily="var(--font-cormorant), serif">
          {CERT.level}
        </text>
      </g>
    </svg>
  );
}
