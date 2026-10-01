"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useMotionMode } from "@/components/story/motion";
import { useTilt } from "@/components/motion/useTilt";
import { LogoSeal } from "@/components/story/LogoSeal";

/**
 * "Biz haqimizda" bloki — jonli kompozitsiya:
 *  - chapda: tog' rasmi parallaks bilan (sichqoncha/skroll), suzib yuruvchi tuman,
 *    aylanib o'tuvchi yorug'lik nuri, CEFR "balandlik o'lchagichi" (A1 → C1 ko'tariladi)
 *    va qo'lda chizilgan chiziq bilan iqtibos;
 *  - o'ngda: matn navbatma-navbat chiqadi, pastda logo atrofida to'rt ko'nikma aylanadi.
 * Ko'rinmaganda animatsiyalar to'xtaydi; JS yo'q yoki "harakatni kamaytirish" — tayyor holat.
 */

export interface AboutCopy {
  eyebrow: string;
  quote: string;
  hand: string;
  paragraphs: string[];
  skillsFact: string;
  goalFact: string;
  altitude: string;
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const SKILLS = [
  { name: "Reading", tone: "#e3a79b" },
  { name: "Listening", tone: "#d9b382" },
  { name: "Writing", tone: "#3cc3b1" },
  { name: "Speaking", tone: "#8a96ff" },
];

export function AboutPeak({ copy }: { copy: AboutCopy }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const mode = useMotionMode();
  useTilt(visualRef);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (mode === "static") {
      root.classList.remove("ab-js");
      root.classList.add("is-in");
      return;
    }
    root.classList.add("ab-js");
    // bir marta: blok ekranga yetib kelganda sahna "ochiladi"
    const enter = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          root.classList.add("is-in");
          enter.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    // doimiy animatsiyalar faqat ko'rinib turganda ishlaydi
    const live = new IntersectionObserver(([e]) =>
      root.classList.toggle("is-live", e.isIntersecting),
    );
    enter.observe(root);
    live.observe(root);
    return () => {
      enter.disconnect();
      live.disconnect();
    };
  }, [mode]);

  return (
    <div ref={rootRef} className="ab card-glass" data-mode={mode}>
      {/* ------------------------------------------------ Chap: jonli tog' */}
      <div ref={visualRef} className="ab-visual">
        <div className="ab-img">
          <Image
            src="/design/ambient-peak.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="ab-shade" aria-hidden />
        <div className="ab-beam" aria-hidden />
        <div className="ab-fog ab-fog-1" aria-hidden />
        <div className="ab-fog ab-fog-2" aria-hidden />

        {/* CEFR balandlik o'lchagichi */}
        <div className="ab-alt" aria-hidden>
          <p className="ab-alt-label">{copy.altitude}</p>
          <div className="ab-alt-rail">
            <span className="ab-alt-fill" />
            {LEVELS.map((lv, i) => (
              <span
                key={lv}
                className="ab-alt-mark"
                style={{ "--i": i } as React.CSSProperties}
              >
                <i />
                <b>{lv}</b>
              </span>
            ))}
            <span className="ab-alt-climber" />
          </div>
        </div>

        <figure className="ab-quote">
          <blockquote>“{copy.quote}”</blockquote>
          <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden>
            <path
              d="M4 13 C 70 4, 140 18, 200 9 S 280 7, 296 12"
              pathLength={1}
            />
          </svg>
        </figure>
      </div>

      {/* ------------------------------------------------ O'ng: matn */}
      <div className="ab-copy">
        <p
          className="eyebrow ab-in"
          style={{ "--d": 0 } as React.CSSProperties}
        >
          <span className="h-px w-5 bg-brand-400" aria-hidden />
          {copy.eyebrow}
        </p>
        <h2
          className="display-title mt-4 text-4xl sm:text-[46px] ab-in"
          style={{ "--d": 1 } as React.CSSProperties}
        >
          Level<span className="ab-x">X</span> English
        </h2>
        <p
          className="hero-hand ab-in"
          style={{ "--d": 2 } as React.CSSProperties}
        >
          {copy.hand}
        </p>
        <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted">
          {copy.paragraphs.map((text, i) => (
            <p
              key={i}
              className="ab-in"
              style={{ "--d": 3 + i } as React.CSSProperties}
            >
              {text}
            </p>
          ))}
        </div>

        <div
          className="ab-foot ab-in"
          style={{ "--d": 5 } as React.CSSProperties}
        >
          <div className="ab-orbit" aria-hidden>
            <svg viewBox="0 0 200 200" className="ab-orbit-rings">
              <circle cx="100" cy="100" r="78" />
              <circle cx="100" cy="100" r="54" />
            </svg>
            <div className="ab-orbit-spin">
              {SKILLS.map((s, i) => (
                <span
                  key={s.name}
                  className="ab-pill"
                  style={
                    {
                      "--a": `${i * 90}deg`,
                      "--tone": s.tone,
                    } as React.CSSProperties
                  }
                >
                  <span>
                    <i />
                    {s.name}
                  </span>
                </span>
              ))}
            </div>
            <LogoSeal size={64} className="ab-orbit-seal" />
          </div>
          <ul className="ab-facts">
            <li>
              <b className="text-brand-400">4</b>
              <span>{copy.skillsFact}</span>
            </li>
            <li>
              <b className="text-gold-400">1</b>
              <span>{copy.goalFact}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
