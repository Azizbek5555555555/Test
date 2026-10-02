"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

/**
 * Asosiy havolalar — kapsula ichidagi ikkinchi kapsula.
 * Faol havola ostida firuza "tabletka" turadi; sichqoncha boshqa havolaga
 * borganda tabletka unga sirpanib o'tadi, chiqib ketganda faol havolaga qaytadi.
 */
export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const active = items.findIndex((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  const moveTo = useCallback(
    (index: number) => {
      const nav = navRef.current;
      const link = index >= 0 ? linkRefs.current[index] : null;
      if (!nav) return;
      if (!link) {
        nav.style.setProperty("--o", "0");
        return;
      }
      nav.style.setProperty("--x", `${link.offsetLeft}px`);
      nav.style.setProperty("--w", `${link.offsetWidth}px`);
      nav.style.setProperty("--o", "1");
    },
    [],
  );

  // Sahifa yoki til almashganda (matn kengligi o'zgaradi) indikator joyiga qaytadi
  useEffect(() => {
    moveTo(active);
    const onResize = () => moveTo(active);
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(onResize).catch(() => {});
    return () => window.removeEventListener("resize", onResize);
  }, [active, items, moveTo]);

  return (
    <nav ref={navRef} className="site-nav" onPointerLeave={() => moveTo(active)}>
      <span className="site-nav-ind" aria-hidden />
      {items.map((item, i) => (
        <Link
          key={item.href}
          href={item.href}
          ref={(el) => {
            linkRefs.current[i] = el;
          }}
          aria-current={i === active ? "page" : undefined}
          onPointerEnter={() => moveTo(i)}
          onFocus={() => moveTo(i)}
          onBlur={() => moveTo(active)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
