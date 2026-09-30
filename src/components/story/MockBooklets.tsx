"use client";

import { useRef } from "react";
import { BookOpen, Edit3, Headphones, Mic } from "react-feather";
import { useTilt } from "@/components/motion/useTilt";

const BOOKS = [
  { skill: "Listening", meta: "8 qism · 35 daqiqa", icon: Headphones, tone: "#7c89ff" },
  { skill: "Reading", meta: "5 qism · 60 daqiqa", icon: BookOpen, tone: "#e3a79b" },
  { skill: "Writing", meta: "2 topshiriq · 60 daqiqa", icon: Edit3, tone: "#3cc3b1" },
  { skill: "Speaking", meta: "3 qism · 15 daqiqa", icon: Mic, tone: "#d9b382" },
];

/**
 * Full Mock sahifasi: to'rt ko'nikma daftarchasi 3D da yelpig'ichdek ochiladi.
 * Skroll bilan yana kengayadi, sichqoncha bilan og'adi, ustiga kelganda daftar ko'tariladi.
 * Ochilish — sof CSS animatsiya (JS bo'lmasa ham tayyor holat ko'rinadi).
 */
export function MockBooklets() {
  const ref = useRef<HTMLDivElement>(null);
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
                <p className="mb-meta">{b.meta}</p>
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
