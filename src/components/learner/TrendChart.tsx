"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { MAX_SCORE } from "@/lib/scoring";
import type { TrendPoint } from "@/lib/learner-home";

/**
 * Umumiy ball dinamikasi (0–75) — bitta seriya: chiziq + yengil maydon,
 * daraja chegaralari (B1/B2/C1) ingichka chiziqlar, oxirgi nuqta yorlig'i,
 * har bir nuqtada hover/fokus tooltip.
 */
const UZ_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

const W = 640;
const H = 220;
const PAD = { l: 34, r: 40, t: 14, b: 26 };

export function TrendChart({ points, bands }: { points: TrendPoint[]; bands: { level: string; at: number }[] }) {
  const t = useT();
  const [hover, setHover] = useState<number | null>(null);
  // Brauzerlarda "uz" lokali to'liq emas ("M08 29") — oy nomlari qo'lda
  const fmt = {
    format: (d: Date) => {
      const [y, m, day] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(d).split("-").map(Number);
      return t.locale === "en"
        ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(Date.UTC(y, m - 1, day, 12)))
        : `${day}-${UZ_MONTHS[m - 1]}`;
    },
  };

  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - (Math.max(0, Math.min(MAX_SCORE, v)) / MAX_SCORE) * ih;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${PAD.t + ih} L${x(0).toFixed(1)},${PAD.t + ih} Z`;
  const last = points[points.length - 1];
  const active = hover != null ? points[hover] : null;

  return (
    <div className="lt-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("Umumiy ball dinamikasi", "Overall score trend")}>
        <defs>
          <linearGradient id="lt-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Asos va daraja chegaralari */}
        <line className="lt-axis" x1={PAD.l} x2={W - PAD.r} y1={PAD.t + ih} y2={PAD.t + ih} />
        {bands.map((b) => (
          <g key={b.level}>
            <line className="lt-grid" x1={PAD.l} x2={W - PAD.r} y1={y(b.at)} y2={y(b.at)} />
            <text className="lt-band" x={W - PAD.r + 6} y={y(b.at) + 4}>
              {b.level}
            </text>
            <text className="lt-tick" x={PAD.l - 8} y={y(b.at) + 4} textAnchor="end">
              {b.at}
            </text>
          </g>
        ))}
        <text className="lt-tick" x={PAD.l - 8} y={PAD.t + ih + 4} textAnchor="end">
          0
        </text>

        <path className="lt-area" d={area} fill="url(#lt-fill)" />
        <path className="lt-line" d={line} pathLength={1} />

        {hover != null ? (
          <line className="lt-cross" x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} />
        ) : null}

        {points.map((p, i) => (
          <circle
            key={p.id}
            className="lt-dot"
            data-active={hover === i || undefined}
            cx={x(i)}
            cy={y(p.score)}
            r={hover === i ? 6 : 4.5}
            style={{ "--i": i } as React.CSSProperties}
          />
        ))}

        {/* Oxirgi natija — to'g'ridan-to'g'ri yorliq */}
        {last && hover == null ? (
          <text className="lt-last" x={x(points.length - 1) - 10} y={y(last.score) - 12} textAnchor="end">
            {last.score}
          </text>
        ) : null}

        {/* Katta hover zonalari */}
        {points.map((p, i) => {
          const half = points.length === 1 ? iw / 2 : iw / (points.length - 1) / 2;
          return (
            <rect
              key={`h${p.id}`}
              x={x(i) - half}
              y={PAD.t}
              width={half * 2}
              height={ih}
              fill="transparent"
              tabIndex={0}
              aria-label={`${p.title}, ${fmt.format(new Date(p.at))}: ${p.score} / ${MAX_SCORE}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            />
          );
        })}
      </svg>

      {active && hover != null ? (
        <div
          className="lt-tooltip"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            top: `${(y(active.score) / H) * 100}%`,
          }}
          role="status"
        >
          <b>
            {active.score}
            <small> / {MAX_SCORE}</small>
          </b>
          <span>{active.title}</span>
          <span className="lt-date">{fmt.format(new Date(active.at))}</span>
        </div>
      ) : null}
    </div>
  );
}
