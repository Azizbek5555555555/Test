import type { Metadata } from "next";
import Link from "next/link";
import { getContactSettings } from "@/lib/settings";
import { SITE_NAME } from "@/lib/constants";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati",
  description: `${SITE_NAME} foydalanuvchi ma'lumotlarini qanday yig'adi, saqlaydi va himoya qiladi.`,
};

export default async function PrivacyPage() {
  const contact = await getContactSettings();

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
            <strong>Formalar:</strong> kursga yozilish, Premium so&apos;rovi
            yoki biz bilan bog&apos;lanish formasida yozgan ism, telefon va
            xabaringiz.
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
          tanlagan mavzuingiz (yorug&apos;/qorong&apos;i) saqlanadi. Kuzatuv
          yoki reklama cookie&apos;lari ishlatilmaydi.
        </p>
      </LegalSection>

      <LegalSection title="6. Sizning huquqlaringiz">
        <ul>
          <li>
            Ismingizni <Link href="/profile" className="text-brand-600 underline">Profil</Link>{" "}
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
              className="text-brand-600 underline"
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
            <Link href="/contact" className="text-brand-600 underline">
              Biz bilan bog&apos;lanish sahifasi
            </Link>
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
