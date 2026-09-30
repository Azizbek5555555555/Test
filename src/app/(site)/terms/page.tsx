import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Foydalanish shartlari", "Terms of Use"),
    description: t(`${SITE_NAME} platformasidan foydalanish qoidalari.`, `Rules for using the ${SITE_NAME} platform.`),
  };
}

export default async function TermsPage() {
  const t = await getT();
  if (t.locale === "en") return <TermsEn />;
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
            <Link href="/premium" className="text-brand-400 underline">
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
          <Link href="/contact" className="text-brand-400 underline">
            biz bilan bog&apos;laning
          </Link>
          . Ma&apos;lumotlaringiz qanday himoyalanishi{" "}
          <Link href="/privacy" className="text-brand-400 underline">
            Maxfiylik siyosati
          </Link>
          da yozilgan.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

/** Inglizcha versiya (til tugmasi EN bo'lganda) */
function TermsEn() {
  return (
    <LegalPage
      title="Terms of Use"
      description={`By using the ${SITE_NAME} platform you agree to the following terms.`}
      updated="26 September 2026"
    >
      <LegalSection title="1. About the service">
        <p>
          {SITE_NAME} is an online platform for preparing for the Multilevel exam: mock tests, past
          years&apos; questions, General English materials, a Vocabulary game and an exam simulation.
        </p>
      </LegalSection>

      <LegalSection title="2. Account">
        <ul>
          <li>You are responsible for your account — do not share it with others.</li>
          <li>Enter your real name: it appears on results and the leaderboard.</li>
          <li>Creating several accounts to artificially boost the leaderboard is prohibited.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Premium">
        <ul>
          <li>
            Premium is granted for the chosen period (1, 3 or 12 months) and activates once the payment
            is confirmed.
          </li>
          <li>
            Prices are shown on the{" "}
            <Link href="/premium" className="text-brand-400 underline">
              Premium
            </Link>{" "}
            page.
          </li>
          <li>
            Payments are not refunded after Premium is activated, except when you could not use the
            service because of a technical fault.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Results">
        <p>
          Scores and CEFR levels on the platform are <strong>estimates for preparation</strong> and do
          not replace an official Multilevel exam result.
        </p>
      </LegalSection>

      <LegalSection title="5. Prohibited">
        <ul>
          <li>Copying, distributing or selling test questions and materials</li>
          <li>Attempting to break the platform or access other accounts</li>
          <li>Collecting points with bots or scripts</li>
          <li>Posting abusive or illegal content</li>
        </ul>
        <p>
          Accounts that break the rules may be blocked without warning and their results removed from
          the leaderboard.
        </p>
      </LegalSection>

      <LegalSection title="6. Copyright">
        <p>
          The tests, articles, audio and design on the platform belong to {SITE_NAME}. They may be used
          for personal preparation only.
        </p>
      </LegalSection>

      <LegalSection title="7. Changes and contact">
        <p>
          These terms may be updated — the new version will be published on this page. If you have
          questions,{" "}
          <Link href="/contact" className="text-brand-400 underline">
            contact us
          </Link>
          . How your data is protected is described in the{" "}
          <Link href="/privacy" className="text-brand-400 underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
