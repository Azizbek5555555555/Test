"use client";

import { useT } from "@/i18n/client";
import { useRef } from "react";
import { BookOpen, Edit3, Headphones, Mic } from "react-feather";
import { useTilt } from "@/components/motion/useTilt";

const BOOKS = [
  { skill: "Listening", meta: { uz: "8 qism · 35 daqiqa", en: "8 parts · 35 min" }, icon: Headphones, tone: "#7c89ff" },
  { skill: "Reading", meta: { uz: "5 qism · 60 daqiqa", en: "5 parts · 60 min" }, icon: BookOpen, tone: "#e3a79b" },
  { skill: "Writing", meta: { uz: "2 topshiriq · 60 daqiqa", en: "2 tasks · 60 min" }, icon: Edit3, tone: "#3cc3b1" },
  { skill: "Speaking", meta: { uz: "3 qism · 15 daqiqa", en: "3 parts · 15 min" }, icon: Mic, tone: "#d9b382" },
];

/**
 * Full Mock sahifasi: to'rt ko'nikma daftarchasi 3D da yelpig'ichdek ochiladi.
 * Skroll bilan yana kengayadi, sichqoncha bilan og'adi, ustiga kelganda daftar ko'tariladi.
 * Ochilish — sof CSS animatsiya (JS bo'lmasa ham tayyor holat ko'rinadi).
 */
export function MockBooklets() {
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();
  useTilt(ref);
  return (
    <div ref={ref} className="mb" aria-hidden>
      <div className="mb-glow" />
      <div className="mb-tilt">
        {BOOKS.map((b, i) => {
          const k = i - (BOOKS.length - 1) / 2;
          const Icon = b.icon;
          return (
            <div
              key={b.skill}
              className="mb-book"
              style={{ "--k": k, "--ak": Math.abs(k), "--i": i, "--tone": b.tone } as React.CSSProperties}
            >
              <div className="mb-pages" />
              <div className="mb-cover">
                <span className="mb-spine" />
                <p className="mb-top">
                  LevelX <span>· Full Mock</span>
                </p>
                <span className="mb-icon">
                  <Icon size={22} strokeWidth={1.6} />
                </span>
                <p className="mb-skill">{b.skill}</p>
                <p className="mb-meta">{t(b.meta)}</p>
                <span className="mb-bar" />
                <p className="mb-code">Multilevel · CEFR · 2026</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
