import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Foydalanish shartlari",
  description: `${SITE_NAME} platformasidan foydalanish qoidalari.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Foydalanish shartlari"
      description={`${SITE_NAME} platformasidan foydalanish orqali siz quyidagi shartlarga rozilik bildirasiz.`}
      updated="2026-yil 26-sentabr"
    >
      <LegalSection title="1. Xizmat haqida">
        <p>
          {SITE_NAME} — Multilevel imtihoniga tayyorlanish uchun onlayn
          platforma: mock testlar, o&apos;tgan yillar savollari, General English
          materiallari, Vocabulary o&apos;yini va imtihon simulyatsiyasi.
        </p>
      </LegalSection>

      <LegalSection title="2. Hisob">
        <ul>
          <li>Hisobingiz uchun o&apos;zingiz javobgarsiz — uni boshqalarga bermang.</li>
          <li>Haqiqiy ismingizni kiriting: u natijalar va reytingda ko&apos;rinadi.</li>
          <li>
            Bir kishi bir nechta hisob ochib reytingni sun&apos;iy oshirishi
            taqiqlanadi.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Premium">
        <ul>
          <li>
            Premium tanlangan muddatga (1, 3 yoki 12 oy) beriladi va administrator
            to&apos;lovni tasdiqlagach faollashadi.
          </li>
          <li>
            Narxlar{" "}
            <Link href="/premium" className="text-brand-600 underline">
              Premium
            </Link>{" "}
            sahifasida ko&apos;rsatilgan.
          </li>
          <li>
            Premium faollashgandan keyin to&apos;lov qaytarilmaydi, texnik
            nosozlik tufayli xizmatdan foydalana olmagan holatlar bundan
            mustasno.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Natijalar">
        <p>
          Platformadagi ballar va CEFR darajalari <strong>tayyorgarlik uchun
          taxminiy</strong> hisoblanadi va rasmiy Multilevel imtihoni natijasi
          o&apos;rnini bosmaydi.
        </p>
      </LegalSection>

      <LegalSection title="5. Taqiqlanadi">
        <ul>
          <li>Test savollari va materiallarni nusxalab tarqatish yoki sotish</li>
          <li>Platformani buzishga, boshqa hisoblarga kirishga urinish</li>
          <li>Bot yoki skript orqali ball yig&apos;ish</li>
          <li>Haqoratli yoki noqonuniy kontent yuborish</li>
        </ul>
        <p>
          Qoidalarni buzgan hisob ogohlantirishsiz bloklanishi va natijalari
          reytingdan o&apos;chirilishi mumkin.
        </p>
      </LegalSection>

      <LegalSection title="6. Mualliflik huquqi">
        <p>
          Platformadagi testlar, maqolalar, audio va dizayn {SITE_NAME}ga
          tegishli. Ulardan faqat shaxsiy tayyorgarlik uchun foydalanish mumkin.
        </p>
      </LegalSection>

      <LegalSection title="7. O'zgarishlar va bog'lanish">
        <p>
          Shartlar yangilanishi mumkin — yangi tahrir shu sahifada e&apos;lon
          qilinadi. Savollar bo&apos;lsa,{" "}
          <Link href="/contact" className="text-brand-600 underline">
            biz bilan bog&apos;laning
          </Link>
          . Ma&apos;lumotlaringiz qanday himoyalanishi{" "}
          <Link href="/privacy" className="text-brand-600 underline">
            Maxfiylik siyosati
          </Link>
          da yozilgan.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
