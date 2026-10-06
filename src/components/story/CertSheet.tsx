"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useT } from "@/i18n/client";
import { CERT, CERT_TEXT, type CertRect, type SkillKey } from "@/lib/home-story";

/** Sertifikat varag'ining ichki eni (px) — HomeStory dvigateli ham shu o'lchamda hisoblaydi */
export const CERT_W = 440;
const CERT_H = CERT_W * CERT.ratio;

/** Lupa: diametri va kattalashtirish */
const LENS = 108;
const ZOOM = 2.5;

const at = (r: CertRect, pad = 0): CSSProperties => ({
  left: `${r.x - pad}%`,
  top: `${r.y - pad / CERT.ratio}%`,
  width: `${r.w + pad * 2}%`,
  height: `${r.h + (pad * 2) / CERT.ratio}%`,
});

/** Lupa ichidagi fon: katakcha markazi lupa markaziga to'g'ri keladi */
function lensStyle(r: CertRect): CSSProperties {
  const cx = ((r.x + r.w / 2) / 100) * CERT_W;
  const cy = ((r.y + r.h / 2) / 100) * CERT_H;
  return {
    left: cx - LENS / 2,
    top: cy - LENS / 2,
    width: LENS,
    height: LENS,
    backgroundImage: `url(${CERT.src})`,
    backgroundSize: `${CERT_W * ZOOM}px ${CERT_H * ZOOM}px`,
    backgroundPosition: `${LENS / 2 - cx * ZOOM}px ${LENS / 2 - cy * ZOOM}px`,
  };
}

const TICKS: { key: SkillKey; draw: string }[] = [
  { key: "listening", draw: "tickListening" },
  { key: "reading", draw: "tickReading" },
  { key: "writing", draw: "tickWriting" },
  { key: "speaking", draw: "tickSpeaking" },
];

/**
 * Bosh sahifa hero'sidagi haqiqiy sertifikat (Mr. Shokir, C1).
 * Ustidagi animatsiyalar HomeStory dvigateli orqali skroll bilan boshqariladi:
 * data-reveal (marker / qo'lyozma), data-pen (ruchka), data-hl (lupa),
 * data-draw (chiziladigan belgilar), data-kf (muhr, yorliq, qog'oz, QR).
 */
export function CertSheet() {
  const t = useT();
  const name = CERT.name;

  return (
    <div className="cert" style={{ width: CERT_W, height: CERT_H }}>
      <Image
        src={CERT.src}
        alt={t(CERT_TEXT.alt)}
        fill
        priority
        sizes="(min-width: 1024px) 520px, 80vw"
        className="cert-img"
      />
      <div className="cert-sheen" aria-hidden />

      {/* 01 · Ism ustidan marker yuradi */}
      <div
        data-reveal="name"
        className="cert-mark"
        style={{ ...at(name, 0.8), clipPath: "inset(0 100% 0 0)" }}
        aria-hidden
      >
        {CERT.nameLines.map((line, i) => (
          <i
            key={i}
            style={{
              top: `${((line.y - name.y + 0.8 / CERT.ratio) / (name.h + 1.6 / CERT.ratio)) * 100}%`,
              width: `${(line.w / (name.w + 1.6)) * 100}%`,
            }}
          />
        ))}
      </div>
      <div
        data-pen="name"
        className="cert-pen"
        style={{ left: `${name.x - 0.8}%`, top: `${name.y + name.h * 0.62}%`, opacity: 0 }}
        aria-hidden
      >
        <Marker />
      </div>

      {/* "Ustozingiz" yorlig'i — ism va rasm orasida, strelka rasmga qaraydi */}
      <div
        data-kf="tag"
        data-basis="sheet"
        className="cert-tag"
        style={{ left: "52.5%", top: `${CERT.photo.y + 4.6}%`, opacity: 0 }}
        aria-hidden
      >
        <span>{t(CERT_TEXT.teacher)}</span>
        <svg viewBox="0 0 34 26" className="cert-tag-arrow">
          <path data-draw="tagArrow" d="M2 20 C 10 6, 20 20, 31 8 M31 8 l -9 0 M31 8 l -2 8" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
        </svg>
      </div>

      {/* 02–05 · Ballar: lupa bilan kattalashadi, yoniga belgi qo'yiladi */}
      {TICKS.map(({ key, draw }) => {
        const r = CERT.scores[key];
        return (
          <svg
            key={key}
            viewBox="0 0 30 24"
            className="cert-tick"
            style={{ left: `${r.x + r.w - 2.6}%`, top: `${r.y - 1.6}%` }}
            aria-hidden
          >
            <path data-draw={draw} d="M3 13 L 11 20 L 27 3" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 }} />
          </svg>
        );
      })}
      {(Object.keys(CERT.scores) as SkillKey[]).map((key) => (
        <div key={key} data-hl={key} className="cert-lens" style={{ ...lensStyle(CERT.scores[key]), opacity: 0 }} aria-hidden>
          <i className="cert-lens-handle" />
        </div>
      ))}

      {/* 06 · Umumiy ball: lupa va qizil doira */}
      <div data-hl="overall" className="cert-lens" style={{ ...lensStyle(CERT.overall), opacity: 0 }} aria-hidden>
        <i className="cert-lens-handle" />
      </div>
      <svg className="cert-circle" viewBox="0 0 100 70" preserveAspectRatio="none" style={at(CERT.overall, 3.4)} aria-hidden>
        <path
          data-draw="circle"
          d="M14 40 C 10 12, 84 4, 92 30 C 99 56, 40 70, 16 56 C 4 48, 10 26, 36 18"
          pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
        />
      </svg>

      {/* 07 · O'qituvchining yopishqoq qog'ozi — qizil ruchka bilan */}
      <div data-kf="note" data-basis="sheet" className="cert-note" style={{ opacity: 0 }} aria-hidden>
        <p className="cert-note-label">{t(CERT_TEXT.noteLabel)}</p>
        <div className="relative">
          <span data-reveal="note" className="cert-note-text" style={{ clipPath: "inset(0 100% 0 0)" }}>
            {t(CERT_TEXT.note)}
          </span>
          <div data-pen="note" className="cert-pen cert-pen-note" style={{ opacity: 0 }}>
            <RedPen />
          </div>
        </div>
      </div>

      {/* 08 · Daraja katakchasi oltin nur bilan, burchakda C1 muhri */}
      <div data-kf="levelGlow" className="cert-level" style={{ ...at(CERT.level, 0.6), opacity: 0 }} aria-hidden />
      <div data-kf="stampC1" className="cert-stamp" style={{ opacity: 0 }} aria-hidden>
        <Stamp />
      </div>

      {/* Yakun · QR kod skaneri va tekshirish manzili */}
      <div data-kf="scan" className="cert-scan" style={{ ...at(CERT.qr, 0.6), opacity: 0 }} aria-hidden>
        <i />
      </div>
      <div
        data-kf="verified"
        data-basis="sheet"
        className="cert-verified"
        style={{ left: `${CERT.qr.x + CERT.qr.w + 2}%`, top: `${CERT.qr.y + CERT.qr.h * 0.6}%`, opacity: 0 }}
        aria-hidden
      >
        <b>✓ {t(CERT_TEXT.verified)}</b>
        <small>{CERT_TEXT.verifiedSub}</small>
      </div>
    </div>
  );
}

/** Oltin muhr (sertifikat chetida, "nishon" kabi) */
function Stamp() {
  const color = "#b8883f";
  return (
    <svg viewBox="0 0 120 120" width="112" height="112">
      <defs>
        <path id="cert-arc-top" d="M 20 60 A 40 40 0 0 1 100 60" />
        <path id="cert-arc-bottom" d="M 22 64 A 38 38 0 0 0 98 64" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="rgba(255, 248, 230, 0.55)" />
      <g fill="none" stroke={color} opacity="0.92">
        <circle cx="60" cy="60" r="55" strokeWidth="3.2" />
        <circle cx="60" cy="60" r="47" strokeWidth="1.2" />
      </g>
      <text fill={color} fontSize="10" fontWeight="700" letterSpacing="3">
        <textPath href="#cert-arc-top" startOffset="50%" textAnchor="middle">
          CEFR LEVEL
        </textPath>
      </text>
      <text fill={color} fontSize="8" fontWeight="700" letterSpacing="1.6">
        <textPath href="#cert-arc-bottom" startOffset="50%" textAnchor="middle">
          MR. SHOKIR · 69/75
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
        style={{ fontVariantNumeric: "lining-nums" }}
      >
        C1
      </text>
    </svg>
  );
}

/** Marker (uchi chap pastda — tashqi element aynan shu nuqtani siljitadi) */
function Marker() {
  return (
    <svg className="story-pen-svg" viewBox="0 0 160 22" width="160" height="22">
      <defs>
        <linearGradient id="cert-marker" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3fd3bd" />
          <stop offset="1" stopColor="#0b8a79" />
        </linearGradient>
      </defs>
      <path d="M0 6 L14 3 L14 19 L0 16 Z" fill="#f6d34a" />
      <rect x="14" y="2" width="16" height="18" rx="2" fill="#141b2b" />
      <rect x="30" y="1" width="126" height="20" rx="8" fill="url(#cert-marker)" />
      <rect x="40" y="5" width="70" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

/** O'qituvchining qizil ruchkasi */
function RedPen() {
  return (
    <svg className="story-pen-svg" viewBox="0 0 160 20" width="160" height="20">
      <defs>
        <linearGradient id="cert-redpen" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c8463b" />
          <stop offset="1" stopColor="#8e2a22" />
        </linearGradient>
      </defs>
      <path d="M0 10 L16 5 L22 5 L22 15 L16 15 Z" fill="#d9b26a" />
      <path d="M0 10 L16 10" stroke="#8a6a3a" strokeWidth="0.8" />
      <rect x="22" y="4" width="30" height="12" rx="3" fill="#141b2b" />
      <rect x="52" y="3" width="6" height="14" fill="#d9b26a" />
      <rect x="58" y="3" width="98" height="14" rx="7" fill="url(#cert-redpen)" />
      <rect x="120" y="1" width="4" height="10" rx="1" fill="#d9b26a" />
    </svg>
  );
}
