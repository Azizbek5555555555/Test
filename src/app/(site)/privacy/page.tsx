import type { Metadata } from "next";
import Link from "next/link";
import { getContactSettings } from "@/lib/settings";
import { SITE_NAME } from "@/lib/constants";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";
import { getT } from "@/i18n/server";
import type { ContactSettings } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Maxfiylik siyosati", "Privacy Policy"),
    description: t(
      `${SITE_NAME} foydalanuvchi ma'lumotlarini qanday yig'adi, saqlaydi va himoya qiladi.`,
      `How ${SITE_NAME} collects, stores and protects user data.`,
    ),
  };
}

export default async function PrivacyPage() {
  const [contact, t] = await Promise.all([getContactSettings(), getT()]);
  if (t.locale === "en") return <PrivacyEn contact={contact} />;

  return (
    <LegalPage
      title="Maxfiylik siyosati"
      description={`${SITE_NAME} qanday ma'lumotlarni yig'adi, ulardan nima uchun foydalanadi va ularni qanday himoya qiladi.`}
      updated="2026-yil 26-sentabr"
    >
      <LegalSection title="1. Qanday ma'lumotlarni yig'amiz">
        <ul>
          <li>
            <strong>Google orqali kirganda:</strong> ismingiz, email manzilingiz
            va profil rasmingiz. Google parolingizni biz hech qachon ko&apos;rmaymiz.
          </li>
          <li>
            <strong>Email orqali kirganda:</strong> email manzilingiz va siz
            kiritgan ism.
          </li>
          <li>
            <strong>Platformadan foydalanish:</strong> test javoblaringiz,
            natijalaringiz, Writing matnlari, Speaking audio yozuvlari,
            Vocabulary o&apos;yini ballari.
          </li>
          <li>
            <strong>Formalar:</strong> Premium so&apos;rovi yoki biz bilan
            bog&apos;lanish formasida yozgan ism, telefon va xabaringiz.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Ma'lumotlardan nima uchun foydalanamiz">
        <ul>
          <li>Hisobingizga kirish va natijalaringizni saqlash uchun</li>
          <li>Testlarni baholash va CEFR darajangizni aniqlash uchun</li>
          <li>
            O&apos;qituvchi Writing va Speaking javoblaringizni tekshirishi uchun
          </li>
          <li>Reyting (Leaderboard) jadvalini ko&apos;rsatish uchun</li>
          <li>So&apos;rov va arizalaringizga javob berish uchun</li>
        </ul>
        <p>
          Ma&apos;lumotlaringizni <strong>sotmaymiz</strong> va reklama uchun
          uchinchi shaxslarga <strong>bermaymiz</strong>.
        </p>
      </LegalSection>

      <LegalSection title="3. Boshqalarga nima ko'rinadi">
        <ul>
          <li>
            <strong>Leaderboard</strong> da faqat ismingiz, rasmingiz va
            ballingiz ko&apos;rinadi.
          </li>
          <li>
            Test natijalaringiz, javoblaringiz va audio yozuvlaringiz faqat
            sizga va platforma o&apos;qituvchilariga ko&apos;rinadi.
          </li>
          <li>Email va telefon raqamingiz boshqa foydalanuvchilarga ko&apos;rinmaydi.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Ma'lumotlar qayerda saqlanadi">
        <p>
          Ma&apos;lumotlar <strong>Supabase</strong> (ma&apos;lumotlar bazasi va
          fayllar) xizmatida shifrlangan ulanish orqali saqlanadi. Har bir
          foydalanuvchi faqat o&apos;z ma&apos;lumotlarini ko&apos;ra oladi —
          bu baza darajasida ta&apos;minlangan. Kirish uchun Google OAuth
          xizmatidan foydalaniladi.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookie (kuki) fayllari">
        <p>
          Faqat tizimga kirganingizni eslab qolish uchun zarur cookie fayllar va
          tanlagan tilingiz (UZ/EN) saqlanadi. Kuzatuv
          yoki reklama cookie&apos;lari ishlatilmaydi.
        </p>
      </LegalSection>

      <LegalSection title="6. Sizning huquqlaringiz">
        <ul>
          <li>
            Ismingizni <Link href="/profile" className="text-brand-400 underline">Profil</Link>{" "}
            sahifasida istalgan vaqtda o&apos;zgartirishingiz mumkin.
          </li>
          <li>
            Hisobingiz va barcha ma&apos;lumotlaringizni o&apos;chirishni
            so&apos;rashingiz mumkin — quyidagi manzilga yozing, 7 kun ichida
            o&apos;chiriladi.
          </li>
          <li>
            Google hisobingizdan ruxsatni istalgan vaqtda{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 underline"
            >
              myaccount.google.com/permissions
            </a>{" "}
            orqali bekor qilishingiz mumkin.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Bog'lanish">
        <p>Maxfiylik bo&apos;yicha savollar uchun:</p>
        <ul>
          {contact.email ? <li>Email: {contact.email}</li> : null}
          {contact.phone ? <li>Telefon: {contact.phone}</li> : null}
          <li>
            <Link href="/contact" className="text-brand-400 underline">
              Biz bilan bog&apos;lanish sahifasi
            </Link>
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}

/** Inglizcha versiya (til tugmasi EN bo'lganda) */
function PrivacyEn({ contact }: { contact: ContactSettings }) {
  return (
    <LegalPage
      title="Privacy Policy"
      description={`What data ${SITE_NAME} collects, why it is used and how it is protected.`}
      updated="26 September 2026"
    >
      <LegalSection title="1. What data we collect">
        <ul>
          <li>
            <strong>When you sign in with Google:</strong> your name, email address and profile
            picture. We never see your Google password.
          </li>
          <li>
            <strong>When you sign in with email:</strong> your email address and the name you enter.
          </li>
          <li>
            <strong>Using the platform:</strong> your test answers, results, Writing texts, Speaking
            audio recordings and Vocabulary game scores.
          </li>
          <li>
            <strong>Forms:</strong> the name, phone number and message you write in a Premium request
            or the contact form.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Why we use the data">
        <ul>
          <li>To sign you in and save your results</li>
          <li>To mark tests and determine your CEFR level</li>
          <li>So that a teacher can review your Writing and Speaking answers</li>
          <li>To show the Leaderboard</li>
          <li>To reply to your requests and applications</li>
        </ul>
        <p>
          We do <strong>not sell</strong> your data and do <strong>not share</strong> it with third
          parties for advertising.
        </p>
      </LegalSection>

      <LegalSection title="3. What others can see">
        <ul>
          <li>
            The <strong>Leaderboard</strong> shows only your name, picture and score.
          </li>
          <li>
            Your test results, answers and audio recordings are visible only to you and the
            platform&apos;s teachers.
          </li>
          <li>Your email and phone number are not visible to other users.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Where the data is stored">
        <p>
          Data is stored with <strong>Supabase</strong> (database and files) over an encrypted
          connection. Each user can see only their own data — this is enforced at the database
          level. Google OAuth is used for sign-in.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies">
        <p>
          We only store the cookies needed to keep you signed in and to remember your chosen language
          (UZ/EN). No tracking or advertising cookies are used.
        </p>
      </LegalSection>

      <LegalSection title="6. Your rights">
        <ul>
          <li>
            You can change your name at any time on the{" "}
            <Link href="/profile" className="text-brand-400 underline">
              Profile
            </Link>{" "}
            page.
          </li>
          <li>
            You can ask us to delete your account and all your data — write to the address below and
            it will be deleted within 7 days.
          </li>
          <li>
            You can revoke access from your Google account at any time via{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 underline"
            >
              myaccount.google.com/permissions
            </a>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Contact">
        <p>For privacy questions:</p>
        <ul>
          {contact.email ? <li>Email: {contact.email}</li> : null}
          {contact.phone ? <li>Phone: {contact.phone}</li> : null}
          <li>
            <Link href="/contact" className="text-brand-400 underline">
              Contact page
            </Link>
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
