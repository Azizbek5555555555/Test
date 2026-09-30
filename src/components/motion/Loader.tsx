/**
 * LevelX yuklanish belgisi: doira bo'ylab kattalashib, yorishib boruvchi
 * nuqtalar ("kometa" dumi) aylanadi, o'rtada brend yozuvi.
 * Faqat CSS animatsiya (transform) — JS kerak emas, protsessorni yuklamaydi.
 */

const COUNT = 24;
const SPAN = 320; // nuqtalar egallaydigan yoy (gradus)

/** Nuqtalar: dumdan (kichik, xira) boshga (katta, yorqin) */
export function loaderDots() {
  return Array.from({ length: COUNT }, (_, i) => {
    const t = i / (COUNT - 1);
    return {
      angle: +(i * (SPAN / (COUNT - 1))).toFixed(2),
      size: +(2 + Math.pow(t, 1.6) * 11).toFixed(2),
      opacity: +(0.12 + 0.88 * Math.pow(t, 1.2)).toFixed(3),
      glow: t > 0.6,
    };
  });
}

export function Loader({ size = 132, label, className = "" }: { size?: number; label?: string; className?: string }) {
  return (
    <div
      className={`lx-loader ${className}`}
      style={{ "--sz": `${size}px`, "--k": +(size / 132).toFixed(3) } as React.CSSProperties}
      role="status"
      aria-live="polite"
    >
      <div className="lx-ring" aria-hidden>
        {loaderDots().map((d, i) => (
          <span
            key={i}
            className={d.glow ? "lx-dot is-glow" : "lx-dot"}
            style={{ "--a": `${d.angle}deg`, "--d": d.size, "--o": d.opacity } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="lx-loader-text">
        <b>
          LevelX <span>English</span>
        </b>
        <small>
          {label ?? (
            // til <html lang> bo'yicha tanlanadi (loading.tsx serverda tilni bilmasa ham)
            <>
              <span className="i18n-uz">Yuklanmoqda</span>
              <span className="i18n-en">Loading</span>
            </>
          )}
        </small>
      </div>
    </div>
  );
}

/**
 * Sahifa har safar to'liq yuklanganda (saytga kirish, brauzerda "Yangilash"/F5,
 * yangi tabda ochish) to'liq ekranli yuklanish oynasi. Sayt ichidagi havolalar
 * orqali o'tishda sahifa qayta yuklanmaydi — u yerda sahifa loaderi (loading.tsx) ishlaydi.
 * Belgi React tomonidan chiziladi, lekin odatda yashirin; kichik inline skript
 * har bir yuklanishda <html> ga "lx-splashing" klassini qo'shadi (DOM o'zgarmaydi —
 * gidratsiya xatosi bo'lmaydi). Sahifa to'liq yuklangach (window "load") silliq
 * yo'qoladi; ko'pi bilan 3.5 soniya. JS o'chiq yoki "harakatni kamaytirish"
 * yoqilgan bo'lsa ko'rsatilmaydi.
 */
export function Splash({ label }: { label?: string }) {
  const code = `(function(){try{
if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var h=document.documentElement,t0=Date.now(),done=false;h.classList.add("lx-splashing");
function hide(){if(done)return;done=true;setTimeout(function(){h.classList.add("lx-splash-done");setTimeout(function(){h.classList.remove("lx-splashing","lx-splash-done")},700)},Math.max(0,650-(Date.now()-t0)))}
if(document.readyState==="complete")hide();else window.addEventListener("load",hide);setTimeout(hide,3500);
}catch(e){}})();`;
  return (
    <>
      <div className="lx-splash" aria-hidden>
        <Loader size={210} label={label} />
      </div>
      <script dangerouslySetInnerHTML={{ __html: code }} />
    </>
  );
}
