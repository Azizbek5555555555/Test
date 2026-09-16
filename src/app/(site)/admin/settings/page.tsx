import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, isAdmin } from "@/lib/auth";
import { listSettings } from "@/lib/admin-queries";
import {
  DEFAULT_CEFR_BANDS,
  DEFAULT_CONTACT,
  DEFAULT_PAYMENT,
  DEFAULT_PLANS,
} from "@/lib/defaults";
import { updateSettingAction } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/Card";
import { AdminForm } from "@/components/admin/AdminForm";
import { Collapsible } from "@/components/admin/Collapsible";

export const metadata: Metadata = {
  title: "Sayt sozlamalari",
  robots: { index: false, follow: false },
};

const SETTING_DEFS = [
  {
    key: "contact",
    title: "📞 Kontaktlar",
    subtitle: "Telegram, Instagram, telefon, email, manzil",
    fallback: DEFAULT_CONTACT,
    hint: "Bu ma'lumotlar saytning pastki qismida, Kontakt sahifasida va bosh sahifada ko'rinadi.",
  },
  {
    key: "premium_plans",
    title: "⭐ Premium tariflari",
    subtitle: "Narxlar va muddatlar",
    fallback: DEFAULT_PLANS,
    hint: 'Har bir tarif: { "id", "title", "months", "amount", "note", "popular" }',
  },
  {
    key: "payment",
    title: "💳 To'lov ma'lumotlari",
    subtitle: "Karta raqami va ko'rsatma",
    fallback: DEFAULT_PAYMENT,
    hint: "Premium sahifasida ko'rsatiladi.",
  },
  {
    key: "cefr_bands",
    title: "📊 CEFR chegaralari",
    subtitle: "Qaysi balldan qaysi daraja boshlanadi",
    fallback: DEFAULT_CEFR_BANDS,
    hint: "Masalan B2: 60 — o'rtacha ball 60 dan yuqori bo'lsa B2 beriladi. Bu chegaralar natijalarni hisoblashda ishlatiladi.",
  },
];

export default async function AdminSettingsPage() {
  const me = await getProfile();
  if (!isAdmin(me)) redirect("/admin");

  const settings = await listSettings();
  const map = new Map(settings.map((s) => [s.key, s.value]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold">Sayt sozlamalari</h2>
        <p className="text-sm text-muted mt-0.5">
          Qiymatlar JSON formatida saqlanadi. Tirnoqlar va vergullarga
          e&apos;tibor bering.
        </p>
      </div>

      <Alert tone="info" title="Maslahat">
        Formani saqlashdan oldin JSON to&apos;g&apos;riligini tekshiring. Xato
        bo&apos;lsa, forma ogohlantiradi va eski qiymat saqlanib qoladi.
      </Alert>

      {SETTING_DEFS.map((def) => {
        const current = map.get(def.key) ?? def.fallback;
        return (
          <Collapsible
            key={def.key}
            title={def.title}
            subtitle={def.subtitle}
            defaultOpen={def.key === "contact"}
          >
            <AdminForm
              compact
              action={updateSettingAction}
              submitLabel="Sozlamani saqlash"
              fields={[
                { name: "key", label: "", type: "hidden", defaultValue: def.key },
                {
                  name: "value",
                  label: "Qiymat (JSON)",
                  type: "json",
                  rows: 12,
                  hint: def.hint,
                  defaultValue: JSON.stringify(current, null, 2),
                },
              ]}
            />
          </Collapsible>
        );
      })}
    </div>
  );
}
