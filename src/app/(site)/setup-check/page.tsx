import type { Metadata } from "next";
import { runSetupDiagnostics, type CheckStatus } from "@/lib/setup-diagnostics";
import { PageHeader, Alert } from "@/components/ui/Card";
import { cn } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sozlamalarni tekshirish",
  robots: { index: false, follow: false },
};

const ICON: Record<CheckStatus, string> = { ok: "✅", warn: "⚠️", fail: "❌" };

const TONE: Record<CheckStatus, string> = {
  ok: "border-emerald-300 dark:border-emerald-800",
  warn: "border-amber-300 dark:border-amber-800",
  fail: "border-rose-300 dark:border-rose-800",
};

/**
 * Supabase ulanishini tekshirish sahifasi.
 * Kalitlarning qiymatini ko'rsatmaydi — faqat turini va natijani.
 */
export default async function SetupCheckPage() {
  const checks = await runSetupDiagnostics();
  const failed = checks.filter((c) => c.status === "fail").length;
  const warned = checks.filter((c) => c.status === "warn").length;

  return (
    <div className="container-page py-10 max-w-3xl">
      <PageHeader
        eyebrow="Diagnostika"
        title="Sozlamalarni tekshirish"
        description="Sayt Supabase bazasiga to'g'ri ulanganini tekshiradi. Kalitlarning o'zi ko'rsatilmaydi — faqat turi va natija."
      />

      <div className="mb-6">
        {failed > 0 ? (
          <Alert tone="danger" title={`${failed} ta muammo topildi`}>
            Quyidagi ❌ belgili qatorlardagi ko&apos;rsatmani bajaring, keyin
            terminalda serverni qayta ishga tushiring (<code>Ctrl+C</code>,
            so&apos;ng <code>npm run dev</code>) va sahifani yangilang.
          </Alert>
        ) : warned > 0 ? (
          <Alert tone="warning" title="Deyarli tayyor">
            Ulanish ishlayapti, lekin ⚠️ belgili qatorlarga e&apos;tibor bering.
          </Alert>
        ) : (
          <Alert tone="success" title="Hammasi joyida 🎉">
            Sayt Supabase bazasiga to&apos;g&apos;ri ulangan.
          </Alert>
        )}
      </div>

      <ul className="space-y-3">
        {checks.map((check) => (
          <li key={check.title} className={cn("card p-4 border", TONE[check.status])}>
            <div className="flex gap-3">
              <span className="text-lg leading-none pt-0.5" aria-hidden>
                {ICON[check.status]}
              </span>
              <div className="min-w-0">
                <p className="font-bold font-mono text-sm break-words">{check.title}</p>
                <p className="text-sm mt-1 break-words">{check.detail}</p>
                {check.fix ? (
                  <p className="text-sm mt-2 text-muted border-l-2 border-line pl-3">
                    👉 {check.fix}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
