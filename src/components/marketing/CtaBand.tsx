import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Figma: sahifa pastidagi keng ko'k banner — chapda matn va tugma,
 * o'ngda tog' "kontur chiziqlari" (topografik xarita) bezagi.
 */
export function CtaBand({
  title,
  text,
  action,
  flushBottom,
}: {
  title: string;
  text: string;
  action: ReactNode;
  /** Sahifaning eng oxirida bo'lsa — pastki panelga yopishadi (footer mt-24 ni qoplaydi) */
  flushBottom?: boolean;
}) {
  return (
    <section className={`theme-keep relative isolate overflow-hidden border-y border-line bg-gradient-to-br ${flushBottom ? "-mb-24" : ""} from-[#1d3257] via-[#141d49] to-[#0f1540]`}>
      <ContourLines className="absolute -right-10 top-0 -z-10 h-full w-[70%] text-gold-400/40 sm:w-[55%]" />
      <div
        aria-hidden
        className="absolute -left-40 -top-40 -z-10 size-[420px] rounded-full bg-brand-400/10 blur-3xl"
      />
      <Reveal className="container-page py-16 sm:py-20">
        <div className="max-w-md">
          <h2 className="display-title text-[34px] leading-tight sm:text-[42px]">{title}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-200">{text}</p>
          <div className="mt-8">{action}</div>
        </div>
      </Reveal>
    </section>
  );
}

function ContourLines({ className }: { className?: string }) {
  // Qo'lda chizilgan topografik halqalar — sekin "nafas oladi" (animate-float)
  const rings = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden fill="none">
      <g className="animate-float" style={{ transformOrigin: "420px 180px" }}>
        {rings.map((i) => {
          const s = 1 + i * 0.34;
          return (
            <path
              key={i}
              d="M420 90c46 4 92 38 96 86 4 44-30 86-80 92-54 6-114-20-128-66-14-46 16-96 62-110 16-4 32-4 50-2z"
              stroke="currentColor"
              strokeWidth={1.4}
              opacity={1 - i * 0.09}
              transform={`translate(420 180) scale(${s}) rotate(${i * 7}) translate(-420 -180)`}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>
    </svg>
  );
}
