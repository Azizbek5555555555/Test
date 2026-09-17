import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Supabase hali ulanmagan bo'lsa, saytning yuqorisida ko'rsatiladigan eslatma.
 * Sozlangandan keyin bu banner o'z-o'zidan yo'qoladi.
 */
export function SetupBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="bg-amber-100 border-b border-amber-300 text-amber-950 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100">
      <div className="container-page py-2.5 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
        <span aria-hidden>⚙️</span>
        <strong>Ma&apos;lumotlar bazasi hali ulanmagan.</strong>
        <span className="opacity-90">
          <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-xs">
            .env.local
          </code>{" "}
          faylini to&apos;ldiring —{" "}
          <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-xs">
            SETUP.md
          </code>{" "}
          faylida qadam-baqadam yozilgan.
        </span>
      </div>
    </div>
  );
}
