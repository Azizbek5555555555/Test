import Link from "next/link";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getContactSettings } from "@/lib/settings";
import { getLeaderboard } from "@/lib/queries";
import { EXAM_YEARS, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { formatXp } from "@/lib/format";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SectionHeading } from "@/components/ui/Card";
import { HomeSectionCard } from "@/components/home/HomeSectionCard";

/** Hujjatning 16-bo'limi: LEARN → PRACTICE → TAKE EXAM → SEE RESULT → IMPROVE */
const JOURNEY = [
  { label: "LEARN", detail: "General English · Articles · Vocabulary", icon: "📚" },
  { label: "PRACTICE", detail: "Reading · Listening · Writing · Speaking", icon: "✏️" },
  { label: "TAKE EXAM", detail: "Full Mock · Exam Full Checking", icon: "🎯" },
  { label: "SEE RESULT", detail: "Ballar · CEFR daraja · Tahlil", icon: "📊" },
  { label: "IMPROVE", detail: "Zaif tomonlar ustida ishlash", icon: "🚀" },
];

export default async function HomePage() {
  const [profile, contact, topPlayers] = await Promise.all([
    getProfile(),
    getContactSettings(),
    getLeaderboard("weekly", 3),
  ]);

  const isPremium = profileHasPremium(profile);
  const firstName = profile?.full_name?.split(/\s+/)[0];

  return (
    <>
      {/* ==================================================== HERO */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700"
          aria-hidden
        />
        <div
          className="absolute -right-24 -top-24 w-[28rem] h-[28rem] rounded-full bg-brand-500/25 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />

        <div className="container-page relative py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-brand-200 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-4">
              {SITE_NAME} · {SITE_TAGLINE}
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] text-balance-title">
              {firstName ? (
                <>
                  Xush kelibsiz, {firstName}!
                  <br />
                  <span className="text-brand-200">Bugun qayerdan</span>{" "}
                  boshlaymiz?
                </>
              ) : (
                <>
                  Multilevel imtihoniga
                  <br />
                  <span className="text-brand-200">tayyorgarlikning</span>{" "}
                  to&apos;liq tizimi
                </>
              )}
            </h1>

            <p className="text-brand-100 text-base sm:text-lg mt-5 leading-relaxed max-w-2xl">
              Full Mock testlar, o&apos;tgan yillarda tushgan savollar, General
              English materiallari, Vocabulary Battle va real imtihon
              simulyatsiyasi — barchasi bitta platformada.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <ButtonLink
                href="/full-mock"
                size="lg"
                variant="light"
              >
                🚀 Bepul mock testni boshlash
              </ButtonLink>
              {isPremium ? (
                <ButtonLink href="/exam-checking" size="lg" variant="premium">
                  ⭐ Exam Full Checking
                </ButtonLink>
              ) : (
                <ButtonLink
                  href="/premium"
                  size="lg"
                  variant="glass"
                >
                  Premium imkoniyatlari
                </ButtonLink>
              )}
            </div>

            {!profile ? (
              <p className="text-brand-200 text-sm mt-5">
                Natijalaringiz saqlanishi uchun{" "}
                <Link href="/login" className="text-white font-bold underline">
                  ro&apos;yxatdan o&apos;ting
                </Link>{" "}
                — 1 daqiqa vaqt oladi.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* ==================================================== JOURNEY */}
      <section className="border-b border-line bg-surface">
        <div className="container-page py-8">
          <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {JOURNEY.map((step, i) => (
              <li
                key={step.label}
                className="relative rounded-xl border border-line bg-[var(--bg-subtle)] p-4"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span aria-hidden className="text-lg">
                    {step.icon}
                  </span>
                  <span className="font-extrabold text-sm tracking-tight">
                    {step.label}
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {step.detail}
                </p>
                {i < JOURNEY.length - 1 ? (
                  <span
                    className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2
                               text-muted text-lg z-10"
                    aria-hidden
                  >
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ==================================================== ASOSIY BO'LIMLAR */}
      <section className="container-page py-14">
        <SectionHeading
          eyebrow="Asosiy bo'limlar"
          title="Qayerdan boshlamoqchisiz?"
          description="Platformaning har bir bo'limi imtihonning aniq bir qismiga qaratilgan."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <HomeSectionCard
            index={1}
            emoji="📝"
            title="FULL MOCK"
            subtitle="To'liq mock testlar — imtihonning barcha to'rt bo'limi."
            items={["Reading", "Listening", "Writing", "Speaking"]}
            href="/full-mock"
            cta="START"
            accent="from-brand-400 to-brand-600"
          />

          <HomeSectionCard
            index={2}
            emoji="🗂️"
            title="OXIRGI TUSHGAN SAVOLLAR"
            subtitle="Real imtihonlarda tushgan va eslab qolingan savollar."
            items={EXAM_YEARS}
            href="/latest-questions"
            cta="EXPLORE"
            accent="from-brand-500 to-brand-700"
          />

          <HomeSectionCard
            index={3}
            emoji="📚"
            title="BOOST YOUR GENERAL ENGLISH"
            subtitle="Faqat imtihon emas — umumiy ingliz tilini kuchaytirish."
            items={["Articles", "Listening Practice", "Vocabulary"]}
            href="/boost"
            cta="START LEARNING"
            accent="from-brand-700 to-brand-900"
          />

          <HomeSectionCard
            index={4}
            emoji="🎮"
            title="VOCABULARY BATTLE"
            subtitle="Kahoot uslubidagi o'yin: tez javob bering, ko'proq ball to'plang."
            items={["Play", "Earn points", "Compete", "Weekly Ranking"]}
            href="/vocabulary-battle"
            cta="PLAY NOW"
            accent="from-brand-600 to-brand-800"
          />

          <HomeSectionCard
            index={5}
            emoji="🎯"
            title="EXAM FULL CHECKING"
            subtitle="Real Multilevel kompyuter imtihoni simulyatsiyasi va to'liq natija."
            items={["Real simulation", "CEFR natija", "O'qituvchi tahlili"]}
            href="/exam-checking"
            cta="START EXAM"
            accent="from-gold-400 to-gold-600"
            badge={<Badge tone="premium">🔒 PREMIUM</Badge>}
          />

          <HomeSectionCard
            index={6}
            emoji="🏫"
            title="OFFLINE COURSES"
            subtitle="Multilevel tayyorlov kurslarimizga qo'shiling."
            items={["B1 Course", "B2 Course", "Intensive"]}
            href="/courses"
            cta="LEARN MORE"
            accent="from-ink-500 to-ink-700"
          />
        </div>
      </section>

      {/* ==================================================== LEADERBOARD */}
      <section className="container-page pb-14">
        <div className="card p-0 overflow-hidden">
          <div className="grid lg:grid-cols-5">
            <div className="lg:col-span-3 p-6 sm:p-8">
              <SectionHeading
                eyebrow="Vocabulary Leaderboard"
                title="Haftalik reyting"
                description="Har hafta yangi start. So'zlarni tez va to'g'ri bilganlar yuqoriga chiqadi."
              />

              {topPlayers.length > 0 ? (
                <ol className="space-y-2.5">
                  {topPlayers.map((player, i) => (
                    <li
                      key={player.user_id}
                      className="flex items-center gap-3 rounded-xl border border-line
                                 bg-[var(--bg-subtle)] p-3"
                    >
                      <span
                        className="w-8 h-8 rounded-lg grid place-items-center font-extrabold text-sm shrink-0
                                   bg-surface border border-line"
                        aria-hidden
                      >
                        {["🥇", "🥈", "🥉"][i] ?? player.rank}
                      </span>
                      <Avatar
                        name={player.full_name}
                        src={player.avatar_url}
                        size="sm"
                        ring={player.is_premium}
                      />
                      <span className="font-semibold text-sm truncate flex-1">
                        {player.full_name}
                      </span>
                      <span className="font-extrabold text-sm tabular-nums text-brand-600 dark:text-brand-400">
                        {formatXp(player.xp)} XP
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted">
                  Bu hafta hali hech kim o&apos;ynamadi — birinchi bo&apos;lish
                  imkoniyati sizda!
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                <ButtonLink href="/vocabulary-battle">🎮 O&apos;ynash</ButtonLink>
                <ButtonLink href="/leaderboard" variant="secondary">
                  To&apos;liq reyting
                </ButtonLink>
              </div>
            </div>

            <div
              className="lg:col-span-2 bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900 p-6 sm:p-8
                         flex flex-col justify-center text-white"
            >
              <p className="text-4xl mb-3" aria-hidden>
                🏆
              </p>
              <h3 className="font-extrabold text-2xl">
                Daily · Weekly · Monthly · All Time
              </h3>
              <p className="text-white/85 text-sm mt-3 leading-relaxed">
                To&apos;g&apos;ri javob uchun 300 ball, tez javob uchun 200
                ballgacha qo&apos;shimcha bonus. Har bir o&apos;yin XP
                to&apos;plamingizni oshiradi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== BIZ HAQIMIZDA */}
      <section className="container-page pb-14" id="about">
        <div className="card p-0 overflow-hidden">
          <div className="grid lg:grid-cols-5">
            <div className="lg:col-span-3 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400 mb-2">
                Biz haqimizda
              </p>
              <h2 className="text-3xl font-extrabold">
                {SITE_NAME}
              </h2>
              <div className="space-y-3 mt-4 text-muted leading-relaxed">
                <p>
                  LevelX English — ingliz tilini o&apos;rganishni yanada
                  tizimli, amaliy va natijaga yo&apos;naltirilgan qilish
                  maqsadida yaratilgan ta&apos;lim brendi. Bizning asosiy
                  maqsadimiz o&apos;quvchiga shunchaki ingliz tilini
                  o&apos;rgatish emas, balki uning mavjud imkoniyatlaridan
                  yuqoriga chiqishiga yordam berishdir.
                </p>
                <p>
                  Platformada Reading, Listening, Writing va Speaking
                  ko&apos;nikmalari bir tizim asosida rivojlanadi: to&apos;liq
                  mock testlar, so&apos;nggi imtihon savollari, General English
                  materiallari, maqolalar, listening practice va vocabulary.
                </p>
                <p>
                  Biz uchun sifatli ta&apos;lim — bu ko&apos;proq material
                  berish emas, balki kerakli materialni to&apos;g&apos;ri
                  tartibda, tushunarli shaklda va aniq maqsad bilan taqdim
                  etishdir.
                </p>
              </div>
            </div>

            <div
              className="lg:col-span-2 bg-gradient-to-br from-brand-800 to-brand-950 p-6 sm:p-8
                         flex flex-col justify-center gap-4 text-white"
            >
              <div>
                <p className="font-display text-5xl font-bold text-brand-300">4</p>
                <p className="text-sm text-white/80 mt-1">
                  ko&apos;nikma — Reading, Listening, Writing, Speaking
                </p>
              </div>
              <div className="h-px bg-white/15" />
              <div>
                <p className="font-display text-5xl font-bold text-brand-300">1</p>
                <p className="text-sm text-white/80 mt-1">
                  maqsad — <span className="font-semibold text-white">{SITE_TAGLINE}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== CONTACT */}
      <section className="container-page pb-16">
        <div className="card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-extrabold">CONTACT US</h2>
              <p className="text-muted mt-2 text-sm leading-relaxed max-w-lg">
                Savollaringiz bormi? Kurslar, Premium yoki natijalar bo&apos;yicha
                biz bilan bog&apos;laning.
              </p>
              {contact.address ? (
                <p className="text-sm text-muted mt-3">{contact.address}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2.5">
              <a
                href={contact.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-line
                           bg-[var(--bg-subtle)] px-4 py-2.5 text-sm font-semibold
                           hover:border-brand-400 transition-colors"
              >
                ✈️ Telegram
              </a>
              <a
                href={contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-line
                           bg-[var(--bg-subtle)] px-4 py-2.5 text-sm font-semibold
                           hover:border-brand-400 transition-colors"
              >
                📸 Instagram
              </a>
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 rounded-xl border border-line
                           bg-[var(--bg-subtle)] px-4 py-2.5 text-sm font-semibold
                           hover:border-brand-400 transition-colors"
              >
                📞 {contact.phone}
              </a>
              <ButtonLink href="/contact" variant="secondary">
                Barcha kontaktlar
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
