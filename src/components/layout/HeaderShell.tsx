"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Sticky header o'rami: sahifa skroll qilinganda `data-scrolled` qo'yadi (kapsula ixchamlashadi) */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="site-header print:hidden" data-scrolled={scrolled || undefined}>
      {children}
    </header>
  );
}
