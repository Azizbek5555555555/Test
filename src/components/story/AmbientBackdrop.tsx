import { PAGE_GLOWS, glowBackground } from "@/lib/home-story";

/**
 * Hikoyadan keyingi bo'limlar ortidagi rangli nurlar. Bir marta chiziladi va
 * kontent bilan birga siljiydi — skroll paytida hech qanday qo'shimcha ish yo'q.
 */
export function AmbientBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate">
      <div className="page-glow" style={{ backgroundImage: glowBackground(PAGE_GLOWS) }} aria-hidden />
      {children}
    </div>
  );
}
