/**
 * Admin panel uchun yengil SVG diagrammalar (kutubxonasiz, serverda chiziladi).
 * Ustiga kursor olib borilganda qiymatlar ko'rinadi (CSS: .ac-*).
 */
import { cn } from "@/lib/format";
import type { PayMethod } from "@/lib/admin-stats";

/** To'lov usullari ranglari — brendlarga yaqin */
export const METHOD_COLOR: Record<PayMethod, string> = {
  payme: "#33c3c7",
  click: "#3d8bff",
  card: "#d9b382",
};

const nf = new Intl.NumberFormat("ru-RU");
export const fmt = (n: number) => nf.format(Math.round(n));

/** O'qdagi eng katta qiymatni "chiroyli" songa yaxlitlaydi */
function niceMax(v: number) {
  if (v <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/* ============================================================================
   Chiziqli (maydonli) grafik
   ============================================================================ */
export interface Series {
  name: string;
  color: string;
  values: number[];
}

export function AreaChart({ labels, series, height = 230 }: { labels: string[]; series: Series[]; height?: number }) {
  const W = 760;
  const H = height;
  const L = 40;
  const R = 14;
  const T = 16;
  const B = 28;
  const n = labels.length;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const x = (i: number) => (n <= 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (n - 1));
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const base = H - B;

  const line = (vals: number[]) => {
    if (vals.length === 1) return `M${x(0)} ${y(vals[0])}`;
    let d = `M${x(0).toFixed(1)} ${y(vals[0]).toFixed(1)}`;
    for (let i = 0; i < vals.length - 1; i++) {
      const p0 = vals[Math.max(0, i - 1)];
      const p1 = vals[i];
      const p2 = vals[i + 1];
      const p3 = vals[Math.min(vals.length - 1, i + 2)];
      const dx = (x(i + 1) - x(i)) / 6;
      // silliq egri chiziq, lekin 0 dan pastga "tushib ketmaydi"
      const c1y = Math.min(base, y(p1) + (y(p2) - y(p0)) / 6);
      const c2y = Math.min(base, y(p2) - (y(p3) - y(p1)) / 6);
      d += ` C${(x(i) + dx).toFixed(1)} ${c1y.toFixed(1)}, ${(x(i + 1) - dx).toFixed(1)} ${c2y.toFixed(1)}, ${x(i + 1).toFixed(1)} ${y(p2).toFixed(1)}`;
    }
    return d;
  };

  const step = Math.max(1, Math.ceil(n / 8));
  // oxirgi belgi oldingisiga juda yaqin bo'lsa, oldingisini tashlab yuboramiz (ustma-ust tushmasin)
  const ticks = labels
    .map((l, i) => ({ l, i }))
    .filter(({ i }) => i === n - 1 || (i % step === 0 && n - 1 - i >= step * 0.6));

  return (
    <svg className="ac" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={series.map((s) => s.name).join(", ")}>
      <defs>
        {series.map((s, si) => (
          <linearGradient key={si} id={`ac-fill-${si}-${s.color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={s.color} stopOpacity="0.32" />
            <stop offset="1" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={L} x2={W - R} y1={y(max * f)} y2={y(max * f)} className="ac-grid" />
          <text x={L - 8} y={y(max * f) + 4} textAnchor="end" className="ac-axis">
            {fmt(max * f)}
          </text>
        </g>
      ))}
      {ticks.map(({ l, i }) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="ac-axis">
          {l}
        </text>
      ))}
      {series.map((s, si) => (
        <g key={s.name}>
          {n > 1 ? (
            <path d={`${line(s.values)} L${x(n - 1)} ${base} L${x(0)} ${base} Z`} fill={`url(#ac-fill-${si}-${s.color.slice(1)})`} />
          ) : null}
          <path d={line(s.values)} fill="none" stroke={s.color} strokeWidth="2.4" strokeLinecap="round" className="ac-line" />
        </g>
      ))}
      {/* har bir nuqta ustida ko'rinadigan qiymatlar */}
      {labels.map((l, i) => {
        const colW = n <= 1 ? W - L - R : (W - L - R) / (n - 1);
        const tipX = Math.min(W - R - 150, Math.max(L, x(i) - 75));
        return (
          <g key={i} className="ac-col">
            <rect x={x(i) - colW / 2} y={T} width={colW} height={base - T} fill="transparent" />
            <line x1={x(i)} x2={x(i)} y1={T} y2={base} className="ac-hl" />
            {series.map((s) => (
              <circle key={s.name} cx={x(i)} cy={y(s.values[i] ?? 0)} r="4.5" fill="#0d1526" stroke={s.color} strokeWidth="2.4" className="ac-dot" />
            ))}
            <g className="ac-tip" transform={`translate(${tipX} ${T})`}>
              <rect width="150" height={22 + series.length * 18} rx="10" />
              <text x="12" y="17" className="ac-tip-title">
                {l}
              </text>
              {series.map((s, si) => (
                <text key={s.name} x="12" y={36 + si * 18} className="ac-tip-row">
                  <tspan fill={s.color}>●</tspan> {s.name}: {fmt(s.values[i] ?? 0)}
                </text>
              ))}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================================
   Doiraviy (donut) diagramma
   ============================================================================ */
export interface Segment {
  label: string;
  value: number;
  color: string;
}

export function Donut({ segments, size = 188, stroke = 20, children }: { segments: Segment[]; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  const live = segments.filter((s) => s.value > 0);
  const gap = live.length > 1 ? c * 0.02 : 0;
  let offset = 0;
  return (
    <div className="ad-donut" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        {total > 0
          ? live.map((s) => {
              const len = (s.value / total) * c;
              const dash = Math.max(0.001, len - gap);
              const el = (
                <circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeLinecap={live.length > 1 ? "butt" : "round"}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  className="ad-donut-seg"
                >
                  <title>{`${s.label}: ${fmt(s.value)} (${Math.round((s.value / total) * 100)}%)`}</title>
                </circle>
              );
              offset += len;
              return el;
            })
          : null}
      </svg>
      <div className="ad-donut-center">{children}</div>
    </div>
  );
}

export function Legend({ segments, format = fmt, suffix }: { segments: Segment[]; format?: (n: number) => string; suffix?: (s: Segment) => string }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <ul className="ad-legend">
      {segments.map((s) => (
        <li key={s.label}>
          <i style={{ background: s.color }} />
          <span className="ad-legend-label">{s.label}</span>
          <span className="ad-legend-value">
            {format(s.value)}
            {suffix ? <small>{suffix(s)}</small> : null}
          </span>
          <span className="ad-legend-pct">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
        </li>
      ))}
    </ul>
  );
}

/* ============================================================================
   Kapsula ustunlar (hafta kunlari bo'yicha faollik)
   ============================================================================ */
export function PillBars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(1, ...values);
  const top = values.indexOf(Math.max(...values));
  return (
    <div className="ad-pills">
      {values.map((v, i) => (
        <div key={i} className={cn("ad-pill", v > 0 && i === top && "is-top")} title={`${labels[i]}: ${fmt(v)}`}>
          <span className="ad-pill-bar" style={{ height: `${Math.max(16, (v / max) * 100)}%` }}>
            <b>{fmt(v)}</b>
          </span>
          <small>{labels[i]}</small>
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   Gorizontal ustunlar
   ============================================================================ */
export function HBars({ items, max, color = "#e3a79b" }: { items: { label: string; value: number | null; hint?: string }[]; max?: number; color?: string }) {
  const m = max ?? Math.max(1, ...items.map((i) => i.value ?? 0));
  return (
    <ul className="ad-hbars">
      {items.map((it) => (
        <li key={it.label}>
          <div className="ad-hbar-head">
            <span>{it.label}</span>
            <b>{it.value === null ? "—" : fmt(it.value)}</b>
          </div>
          <div className="ad-hbar-track">
            <span style={{ width: `${it.value ? Math.min(100, (it.value / m) * 100) : 0}%`, background: color }} />
          </div>
          {it.hint ? <small>{it.hint}</small> : null}
        </li>
      ))}
    </ul>
  );
}

/** O'tgan davrga nisbatan o'zgarish: +12% (yashil) / -8% (qizil) */
export function Delta({ value, prev }: { value: number; prev: number }) {
  if (prev === 0 && value === 0) return <span className="ad-chip">0%</span>;
  if (prev === 0) return <span className="ad-chip ad-chip-up">yangi</span>;
  const pct = Math.round(((value - prev) / prev) * 100);
  return <span className={cn("ad-chip", pct > 0 && "ad-chip-up", pct < 0 && "ad-chip-down")}>{`${pct > 0 ? "+" : ""}${pct}%`}</span>;
}
