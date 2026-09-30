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
import { updateSettingAction, updateSettingFieldsAction } from "@/lib/actions/admin";
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

type Obj = Record<string, unknown>;
const txt = (o: Obj, k: string) => (typeof o[k] === "string" || typeof o[k] === "number" ? String(o[k]) : "");

export default async function AdminSettingsPage() {
  const me = await getProfile();
  if (!isAdmin(me)) redirect("/admin");

  const settings = await listSettings();
  const map = new Map(settings.map((s) => [s.key, s.value]));
  const contact = { ...DEFAULT_CONTACT, ...((map.get("contact") as Obj) ?? {}) } as Obj;
  const payment = { ...DEFAULT_PAYMENT, ...((map.get("payment") as Obj) ?? {}) } as Obj;
  const bands = { ...DEFAULT_CEFR_BANDS, ...((map.get("cefr_bands") as Obj) ?? {}) } as Obj;
  const plans = (Array.isArray(map.get("premium_plans")) ? map.get("premium_plans") : DEFAULT_PLANS) as Obj[];
  // mavjud tariflar + yangi tarif qo'shish uchun bitta bo'sh qator
  const planRows = [...plans, {} as Obj];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold">Sayt sozlamalari</h2>
        <p className="text-sm text-muted mt-0.5">
          O&apos;zgarishlar saqlangan zahoti saytda ko&apos;rinadi.
        </p>
      </div>

      <Collapsible title="📞 Kontaktlar" subtitle="Saytning pastki qismi, Kontakt sahifasi va bosh sahifada ko'rinadi" defaultOpen>
        <AdminForm
          compact
          action={updateSettingFieldsAction}
          submitLabel="Kontaktlarni saqlash"
          fields={[
            { name: "key", label: "", type: "hidden", defaultValue: "contact" },
            { name: "telegram", label: "Telegram kanal havolasi", type: "text", defaultValue: txt(contact, "telegram"), placeholder: "https://t.me/levelxenglish" },
            { name: "telegram_label", label: "Telegram kanal nomi", type: "text", defaultValue: txt(contact, "telegram_label"), placeholder: "@levelxenglish" },
            { name: "telegram_admin", label: "Telegram admin havolasi", type: "text", defaultValue: txt(contact, "telegram_admin"), hint: "Premium cheklari va savollar shu akkauntga yuboriladi" },
            { name: "telegram_admin_label", label: "Telegram admin nomi", type: "text", defaultValue: txt(contact, "telegram_admin_label") },
            { name: "instagram", label: "Instagram havolasi", type: "text", defaultValue: txt(contact, "instagram") },
            { name: "instagram_label", label: "Instagram nomi", type: "text", defaultValue: txt(contact, "instagram_label") },
            { name: "phone", label: "Telefon", type: "text", defaultValue: txt(contact, "phone") },
            { name: "phone_2", label: "Qo'shimcha telefon", type: "text", defaultValue: txt(contact, "phone_2") },
            { name: "email", label: "Email", type: "text", defaultValue: txt(contact, "email") },
            { name: "address", label: "Manzil", type: "text", defaultValue: txt(contact, "address") },
            { name: "map_url", label: "Xarita havolasi (ixtiyoriy)", type: "text", defaultValue: txt(contact, "map_url"), full: true },
          ]}
        />
      </Collapsible>

      <Collapsible title="⭐ Premium tariflari" subtitle="Narxlar Premium sahifasida va Payme/Click to'lovida ishlatiladi">
        <AdminForm
          compact
          action={updateSettingFieldsAction}
          submitLabel="Tariflarni saqlash"
          fields={[
            { name: "key", label: "", type: "hidden", defaultValue: "premium_plans" },
            { name: "plan_count", label: "", type: "hidden", defaultValue: planRows.length },
            ...planRows.flatMap((p, i) => {
              const isNew = i === planRows.length - 1;
              const head = isNew ? "Yangi tarif (ixtiyoriy)" : `${i + 1}-tarif`;
              return [
                { name: `plan_${i}_id`, label: "", type: "hidden" as const, defaultValue: txt(p, "id") },
                { name: `plan_${i}_title`, label: `${head}: nomi`, type: "text" as const, defaultValue: txt(p, "title"), placeholder: "Masalan: 3 oylik", hint: isNew ? undefined : "Nomini o'chirsangiz, tarif olib tashlanadi" },
                { name: `plan_${i}_months`, label: "Muddati (oy)", type: "number" as const, defaultValue: txt(p, "months") },
                { name: `plan_${i}_amount`, label: "Narxi (so'm)", type: "number" as const, defaultValue: txt(p, "amount") },
                { name: `plan_${i}_note`, label: "Izoh (ixtiyoriy)", type: "text" as const, defaultValue: txt(p, "note"), placeholder: "Masalan: 16% tejaysiz" },
              ];
            }),
            {
              name: "popular_index",
              label: "\"Eng ommabop\" belgisi qaysi tarifda",
              type: "select",
              full: true,
              defaultValue: String(Math.max(0, plans.findIndex((p) => p.popular === true))),
              options: plans.map((p, i) => ({ value: String(i), label: txt(p, "title") || `${i + 1}-tarif` })),
            },
          ]}
        />
      </Collapsible>

      <Collapsible title="💳 Karta ma'lumotlari" subtitle="Karta orqali to'lov (Uzcard/Humo) — Premium sahifasida ko'rsatiladi">
        <AdminForm
          compact
          action={updateSettingFieldsAction}
          submitLabel="Karta ma'lumotlarini saqlash"
          fields={[
            { name: "key", label: "", type: "hidden", defaultValue: "payment" },
            { name: "card_number", label: "Karta raqami", type: "text", defaultValue: txt(payment, "card_number"), placeholder: "8600 1234 5678 9012", hint: "8600 — Uzcard, 9860 — Humo" },
            { name: "card_owner", label: "Karta egasi", type: "text", defaultValue: txt(payment, "card_owner") },
            { name: "instruction", label: "Ko'rsatma", type: "textarea", rows: 3, full: true, defaultValue: txt(payment, "instruction") },
          ]}
        />
      </Collapsible>

      <Collapsible title="📊 CEFR chegaralari" subtitle="Umumiy ball (0–100) qaysi darajaga to'g'ri kelishi">
        <AdminForm
          compact
          action={updateSettingFieldsAction}
          submitLabel="Chegaralarni saqlash"
          fields={[
            { name: "key", label: "", type: "hidden", defaultValue: "cefr_bands" },
            { name: "C1", label: "C1 — shu balldan boshlab", type: "number", defaultValue: txt(bands, "C1") },
            { name: "B2", label: "B2 — shu balldan boshlab", type: "number", defaultValue: txt(bands, "B2") },
            { name: "B1", label: "B1 — shu balldan boshlab", type: "number", defaultValue: txt(bands, "B1") },
            { name: "A2", label: "A2 — shu balldan boshlab (pastrog'i A1)", type: "number", defaultValue: txt(bands, "A2") },
          ]}
        />
      </Collapsible>

      {/* ------------------------------------------------ Kengaytirilgan: xom JSON */}
      <details className="card p-5">
        <summary className="cursor-pointer text-sm font-semibold text-muted">
          Kengaytirilgan: JSON ko&apos;rinishida tahrirlash (faqat dasturchi uchun)
        </summary>
        <div className="mt-5 space-y-5">
          <Alert tone="warning" title="Ehtiyot bo'ling">
            JSON xato bo&apos;lsa, forma ogohlantiradi va eski qiymat saqlanib qoladi.
          </Alert>
          {SETTING_DEFS.map((def) => {
            const current = map.get(def.key) ?? def.fallback;
            return (
              <Collapsible key={def.key} title={def.title} subtitle={def.subtitle}>
                <AdminForm
                  compact
                  action={updateSettingAction}
                  submitLabel="Sozlamani saqlash"
                  fields={[
                    { name: "key", label: "", type: "hidden", defaultValue: def.key },
                    { name: "value", label: "Qiymat (JSON)", type: "json", rows: 12, hint: def.hint, defaultValue: JSON.stringify(current, null, 2) },
                  ]}
                />
              </Collapsible>
            );
          })}
        </div>
      </details>
    </div>
  );
}
