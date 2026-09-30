"use client";

import { useRef } from "react";
import { useTilt } from "@/components/motion/useTilt";
import { LogoSeal } from "./LogoSeal";

/**
 * Premium sahifasi: 3D "a'zolik kartasi". Ochilganda orqa tomonidan aylanib
 * old tomoniga o'tadi, keyin sichqoncha va skroll bilan og'adi; yuzasida
 * gologramma yaltirog'i yuradi, atrofida ikki oltin halqa sekin aylanadi.
 */
export function PremiumCard3D({ active }: { active?: boolean }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  useTilt(sceneRef);

  return (
    <div ref={sceneRef} className="pc" aria-hidden>
      <svg className="pc-rings" viewBox="-300 -200 600 400">
        <defs>
          <linearGradient id="pc-gold" x1="-300" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#8a5a1c" stopOpacity="0" />
            <stop offset="0.35" stopColor="#e7b75a" />
            <stop offset="0.55" stopColor="#fff2c8" />
            <stop offset="0.8" stopColor="#e0a84a" />
            <stop offset="1" stopColor="#7a4c14" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="pc-ring pc-ring-a">
          <ellipse rx="280" ry="96" pathLength={1} className="pc-ring-glow" />
          <ellipse rx="280" ry="96" pathLength={1} />
          <ellipse rx="280" ry="96" pathLength={1} className="pc-ring-shine" />
        </g>
        <g className="pc-ring pc-ring-b">
          <ellipse rx="250" ry="150" pathLength={1} className="pc-ring-glow" />
          <ellipse rx="250" ry="150" pathLength={1} />
          <ellipse rx="250" ry="150" pathLength={1} className="pc-ring-shine" />
        </g>
      </svg>
      <div className="pc-shadow" />
      <div className="pc-tilt">
        <div className="pc-card">
          {/* orqa tomoni */}
          <div className="pc-face pc-back">
            <div className="pc-stripe" />
            <div className="pc-sign">
              <span>Authorized Premium member</span>
            </div>
            <p className="pc-back-list">Full Mock · Exam Checking · Writing &amp; Speaking tekshiruvi</p>
            <LogoSeal size={44} className="pc-back-seal" />
          </div>
          {/* old tomoni */}
          <div className="pc-face pc-front">
            <div className="pc-lines" />
            <div className="pc-top">
              <p className="pc-brand">
                LevelX <span>English</span>
              </p>
              <p className="pc-tier">{active ? "Premium · faol" : "Premium"}</p>
            </div>
            <div className="pc-chip-row">
              <span className="pc-chip" />
              <svg className="pc-wave" viewBox="0 0 24 24">
                <path d="M8 7c2 2.5 2 7.5 0 10M12 5c3 3.5 3 10.5 0 14M16 3c4 4.5 4 13.5 0 18" />
              </svg>
            </div>
            <p className="pc-number">LX 2026 •••• 0079</p>
            <div className="pc-bottom">
              <div>
                <p className="pc-label">A&apos;zo</p>
                <p className="pc-name">Sizning ismingiz</p>
              </div>
              <div>
                <p className="pc-label">Since</p>
                <p className="pc-name">2026</p>
              </div>
              <LogoSeal size={50} />
            </div>
            <div className="pc-holo" />
          </div>
        </div>
      </div>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`pc-spark pc-spark-${i}`} />
      ))}
    </div>
  );
}
