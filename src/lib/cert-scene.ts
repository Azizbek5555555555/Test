/**
 * Exam Checking sahifasidagi 3D "CEFR sertifikati" sahnasi — sozlamalar.
 * Sertifikat o'ng tomonda teskari (orqa tomoni bilan) turadi; skroll bilan
 * aylanib old tomoni ochiladi. Oltin chiziqlar aylanayotgan chetdan chiqib
 * sertifikat atrofida aylanadi, oxirida to'xtab, yorug'ligi pasayadi.
 *
 * Barcha vaqtlar — p (0..1): sahna bo'ylab skroll ulushi.
 */
import type { Keyframe, Range } from "@/lib/home-story";

/** Sahna balandligi (vh): qancha uzun bo'lsa, animatsiya shuncha sekin */
export const CERT_HEIGHT = { desktop: 250, mobile: 220 } as const;

/** Sertifikat o'lchami (px, keyin masshtablanadi) — A4 ga yaqin tik varaq */
export const CERT_W = 460;
export const CERT_H = 620;

export const CERT = {
  brand: "LevelX English",
  title: "Certificate",
  subtitle: "of English Language Proficiency",
  certify: "This is to certify that",
  name: "Sizning ismingiz",
  achieved: "has demonstrated English proficiency at",
  level: "C1",
  levelName: "Advanced",
  scale: ["A1", "A2", "B1", "B2", "C1", "C2"],
  /** Shkaladagi qaysi daraja (indeks) belgilanadi */
  levelIndex: 4,
  date: "2026",
  ref: "№ LX-CEFR-0421",
  signer: "Director of Studies",
  sample: "Namuna · Sample",
};

export const CERT_TIMES = {
  name: [0.44, 0.54] as Range,
  scale: [0.46, 0.62] as Range,
  level: [0.58, 0.66] as Range,
  signature: [0.64, 0.76] as Range,
  /** Chap tomondagi CEFR zinapoyasi */
  ladder: [0.36, 0.62] as Range,
  /** Chiziqlar "kuchi" pasayadi: 1 → CERT_REST */
  settle: [0.78, 0.95] as Range,
};

/** Oxirida chiziqlar shu darajagacha xiralashadi (to'liq o'chmaydi) */
export const CERT_REST = 0.45;

export const CERT_KEYFRAMES: Record<string, Keyframe[]> = {
  // Sertifikat: orqa tomoni bilan qiyshiq turadi → aylanadi → to'g'rilanadi
  card: [
    { p: 0, y: 0.02, rx: 16, ry: 180, r: 8, s: 0.9 },
    { p: 0.1, y: 0.02, rx: 16, ry: 180, r: 8, s: 0.9 },
    { p: 0.2, y: 0, rx: 12, ry: 150, r: 5, s: 0.95 },
    { p: 0.42, y: 0, rx: 0, ry: 0, r: -2, s: 1.03 },
    { p: 0.47, s: 1 },
    { p: 1, y: 0, rx: 0, ry: 0, r: -1.5, s: 1 },
  ],
  shadow: [
    { p: 0, o: 0.45, s: 0.9 },
    { p: 0.3, o: 0.3, s: 0.8 },
    { p: 0.45, o: 0.6, s: 1 },
  ],
  // Varaq qirrasi bilan turganda (ry≈90) oltin chaqnash
  flash: [
    { p: 0.22, o: 0, s: 0.5 },
    { p: 0.3, o: 1, s: 1 },
    { p: 0.44, o: 0, s: 1.6 },
  ],
  // Daraja muhri "zarbi"
  level: [
    { p: 0.58, o: 0, s: 2.2 },
    { p: 0.63, o: 1, s: 0.94 },
    { p: 0.66, o: 1, s: 1 },
  ],
  // Chetlaridagi oltin nur (old tomoni ochilgach)
  rim: [
    { p: 0.4, o: 0 },
    { p: 0.52, o: 1 },
  ],
};

/**
 * Orbitalar: sertifikat markazi atrofida kengayib boruvchi ellipslar (Saturn halqasidek
 * og'ma tekislikda). `start` = 0 — o'ng qirra, π — chap qirra (aylanayotgan chetlar).
 */
export interface Orbit {
  /** Boshlang'ich radiuslar (px, sertifikat koordinatasida) */
  rx: number;
  ry: number;
  /** Yo'l davomida radius qancha kattalashadi */
  grow: number;
  /** Necha marta aylanadi */
  turns: number;
  start: number;
  /** Og'ish burchagi (gradus) */
  tilt: number;
  draw: Range;
  width: number;
  sparks: number;
}

export const ORBITS: Orbit[] = [
  { rx: 232, ry: 150, grow: 120, turns: 1.2, start: 0, tilt: -14, draw: [0.2, 0.62], width: 3, sparks: 22 },
  { rx: 236, ry: 120, grow: 150, turns: 1.1, start: Math.PI, tilt: 18, draw: [0.26, 0.68], width: 2.4, sparks: 18 },
  { rx: 250, ry: 190, grow: 100, turns: 1, start: 0.3, tilt: -58, draw: [0.32, 0.74], width: 1.8, sparks: 14 },
];

/** Orbita yo'lini SVG "d" ko'rinishida yasaydi (sertifikat koordinatasida, markaz — o'rtada) */
export function orbitPath(o: Orbit, steps = 180): string {
  const cx = CERT_W / 2;
  const cy = CERT_H / 2;
  const t = (o.tilt * Math.PI) / 180;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const a = o.start + u * o.turns * Math.PI * 2;
    const rx = o.rx + o.grow * u;
    const ry = o.ry + o.grow * u * 0.8;
    const lx = rx * Math.cos(a);
    const ly = ry * Math.sin(a);
    const x = cx + lx * cos - ly * sin;
    const y = cy + lx * sin + ly * cos;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}
