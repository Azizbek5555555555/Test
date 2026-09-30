"use client";

import { useT } from "@/i18n/client";
import { SHEET, SHEET_SKILLS } from "@/lib/home-story";
import { LogoSeal } from "./LogoSeal";

/**
 * "Natija varaqasi" — 440×620 o'lchamda chizilgan, tashqaridan scale qilinadi.
 * Animatsiya uchun belgilar: data-kf (kalit kadr), data-count (sanaluvchi son),
 * data-bar (chiziq), data-hl (qatorni ajratish), data-reveal (yozilib chiqish),
 * data-draw (chiziladigan SVG yo'l), data-pen (ruchka).
 */
export function StorySheet() {
  const t = useT();
  return (
    <div className="story-paper" aria-hidden>
      {/* Qog'oz qisqichi */}
      <svg className="story-clip" viewBox="0 0 28 70" width="28" height="70">
        <path
          d="M9 64V14a7 7 0 0 1 14 0v44a10 10 0 0 1-20 0V20"
          fill="none"
          stroke="#9aa3b5"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>

      {/* Sarlavha */}
      <div className="flex items-start justify-between">
        <div>
          <p className="story-brand">
            LevelX <span>English</span>
          </p>
          <p className="story-mini mt-1">{t(SHEET.subtitle)}</p>
        </div>
        <div className="text-right">
          <p className="story-mini font-semibold tracking-[0.18em]">{t(SHEET.title).toUpperCase()}</p>
          <span className="story-sample">{t(SHEET.sample)}</span>
        </div>
      </div>
      <div className="story-rule mt-4" />

      {/* Ism — ruchka bilan yoziladi */}
      <div className="mt-5">
        <p className="story-label">{t(SHEET.nameLabel)}</p>
        <div className="story-line relative mt-1 h-[46px]">
          <span data-reveal="name" className="story-hand story-hand-blue" style={{ clipPath: "inset(0 100% 0 0)" }}>
            {t(SHEET.name)}
          </span>
          <div data-pen="name" className="story-pen" style={{ opacity: 0 }}>
            <Pen tone="navy" />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="story-label">{t(SHEET.examLabel)}</p>
          <p className="story-value">Multilevel (CEFR)</p>
        </div>
        <div>
          <p className="story-label">{t(SHEET.dateLabel)}</p>
          <p className="story-value">2026</p>
        </div>
      </div>

      {/* Ko'nikmalar jadvali */}
      <div className="mt-5 space-y-[6px]">
        {SHEET_SKILLS.map((skill) => (
          <div key={skill.key} className="story-row">
            <span data-hl={skill.key} className="story-row-hl" style={{ opacity: 0 }} />
            <span className="story-row-label">{skill.label}</span>
            <span className="story-bar">
              <span data-bar={skill.key} className="story-bar-fill" style={{ transform: "scaleX(0)" }} />
            </span>
            <span className="story-score">
              <span data-count={skill.key}>0</span>
              <small>/100</small>
            </span>
            {skill.key === "writing" || skill.key === "speaking" ? (
              <svg className="story-underline" viewBox="0 0 120 12" preserveAspectRatio="none">
                <path
                  data-draw={skill.key === "writing" ? "ulWriting" : "ulSpeaking"}
                  d="M2 8 C 30 3, 60 11, 118 5"
                  pathLength={1}
                  style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                />
              </svg>
            ) : null}
          </div>
        ))}
      </div>

      {/* Umumiy ball + muhrlar */}
      <div className="relative mt-5 flex items-end justify-between">
        <div className="relative">
          <p className="story-label">{t(SHEET.overallLabel)}</p>
          <p className="story-overall">
            <span data-count="overall">0</span>
            <small>/100</small>
          </p>
          <svg className="story-circle" viewBox="0 0 160 90" preserveAspectRatio="none">
            <path
              data-draw="circle"
              d="M22 48 C 18 18, 128 8, 146 38 C 160 66, 60 88, 26 70 C 8 60, 14 36, 40 26"
              pathLength={1}
              style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
            />
          </svg>
        </div>
        <div className="relative size-[118px]">
          <div data-kf="stampB2" className="story-stamp" style={{ opacity: 0 }}>
            <Stamp level="B2" tone="red" />
          </div>
          <div data-kf="stampC1" className="story-stamp" style={{ opacity: 0 }}>
            <Stamp level="C1" tone="gold" />
          </div>
        </div>
      </div>

      {/* O'qituvchi izohi */}
      <div className="story-note mt-4">
        <p className="story-label">{t(SHEET.teacherLabel)}</p>
        <div className="relative mt-1 min-h-[52px]">
          <span data-reveal="note" className="story-hand story-hand-red" style={{ clipPath: "inset(0 100% 0 0)" }}>
            {t(SHEET.teacherNote)}
          </span>
          <div data-pen="note" className="story-pen story-pen-note" style={{ opacity: 0 }}>
            <Pen tone="red" />
          </div>
        </div>
      </div>

      {/* Imzo */}
      <div className="mt-3 flex items-end justify-between">
        <div>
          <svg className="story-signature" viewBox="0 0 150 44">
            <path
              data-draw="signature"
              d="M4 30 C 14 6, 22 40, 30 22 S 44 8, 48 28 S 60 36, 66 20 C 70 10, 76 34, 86 24 C 96 14, 104 30, 118 18 C 126 12, 134 20, 146 14"
              pathLength={1}
              style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
            />
          </svg>
          <div className="story-rule w-[150px]" />
          <p className="story-mini mt-1">{t(SHEET.signatureLabel)}</p>
        </div>
        <LogoSeal size={62} />
      </div>
    </div>
  );
}

/** Muhr: ikki halqa, markazda daraja */
function Stamp({ level, tone }: { level: string; tone: "red" | "gold" }) {
  const color = tone === "red" ? "#c8463b" : "#b8883f";
  return (
    <svg viewBox="0 0 120 120" width="118" height="118">
      <defs>
        <path id={`arc-${level}`} d="M 20 60 A 40 40 0 0 1 100 60" />
        <path id={`arcb-${level}`} d="M 22 64 A 38 38 0 0 0 98 64" />
      </defs>
      <g fill="none" stroke={color} opacity="0.9">
        <circle cx="60" cy="60" r="55" strokeWidth="3.2" />
        <circle cx="60" cy="60" r="47" strokeWidth="1.2" />
      </g>
      <text fill={color} fontSize="10" fontWeight="700" letterSpacing="3" opacity="0.9">
        <textPath href={`#arc-${level}`} startOffset="50%" textAnchor="middle">
          CEFR LEVEL
        </textPath>
      </text>
      <text fill={color} fontSize="9" fontWeight="700" letterSpacing="3" opacity="0.9">
        <textPath href={`#arcb-${level}`} startOffset="50%" textAnchor="middle">
          LEVELX
        </textPath>
      </text>
      <text
        x="60"
        y="72"
        textAnchor="middle"
        fill={color}
        fontSize="38"
        fontWeight="700"
        fontFamily="var(--font-cormorant), serif"
        opacity="0.95"
        style={{ fontVariantNumeric: "lining-nums" }}
      >
        {level}
      </text>
    </svg>
  );
}

/** Ruchka: uchi chap pastda (0,0 nuqta) — tashqi element aynan shu nuqtani siljitadi */
function Pen({ tone }: { tone: "navy" | "red" }) {
  const body = tone === "navy" ? ["#1f2a44", "#3a4a70"] : ["#8e2a22", "#c8463b"];
  const id = `pen-${tone}`;
  return (
    <svg className="story-pen-svg" viewBox="0 0 160 20" width="160" height="20">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={body[1]} />
          <stop offset="1" stopColor={body[0]} />
        </linearGradient>
      </defs>
      {/* uchi (pero) */}
      <path d="M0 10 L16 5 L22 5 L22 15 L16 15 Z" fill="#d9b382" />
      <path d="M0 10 L16 10" stroke="#8a6a3a" strokeWidth="0.8" />
      {/* ushlash joyi */}
      <rect x="22" y="4" width="30" height="12" rx="3" fill="#141b2b" />
      <rect x="52" y="3" width="6" height="14" fill="#d9b382" />
      {/* korpus */}
      <rect x="58" y="3" width="98" height="14" rx="7" fill={`url(#${id})`} />
      <rect x="120" y="1" width="4" height="10" rx="1" fill="#d9b382" />
    </svg>
  );
}
