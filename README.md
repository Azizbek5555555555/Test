# 🎓 Multilevel Plus

**Learn · Practice · Take Exam · Improve**

Multilevel imtihoniga tayyorgarlik uchun to'liq veb-platforma: mock testlar,
o'tgan yillarda tushgan savollar, General English materiallari, Kahoot
uslubidagi so'z o'yini va real imtihon simulyatsiyasi.

> 🚀 **Ishga tushirish uchun → [SETUP.md](./SETUP.md)** (qadam-baqadam, o'zbekcha)

---

## Nima bor

| Bo'lim | Tafsilot |
|---|---|
| 🔐 **Ro'yxatdan o'tish** | Google account + emailga 6 xonali tasdiqlash kodi |
| 📝 **Full Mock** | To'liq mock testlar: Reading · Listening · Writing · Speaking |
| 🗂️ **Oxirgi tushgan savollar** | Yillar bo'yicha arxiv (2025–2026, 2024–2025, 2023–2024) |
| 📚 **Boost Your General English** | 8 mavzuda maqolalar + Listening Practice |
| 🎮 **Vocabulary Battle** | Kahoot uslubidagi o'yin: tezlik bonusi, XP |
| 🏆 **Leaderboard** | Daily · Weekly · Monthly · All Time reyting |
| 🎯 **Exam Full Checking** | Premium: real imtihon simulyatsiyasi (L→R→W→S) |
| 📊 **Natijalar** | Har bo'lim uchun ball + CEFR daraja + PDF |
| ⭐ **Free / Premium** | Har bo'limda bepul va qulflangan kontent |
| 🏫 **Offline kurslar** | Kurs sahifalari + onlayn ariza |
| 📞 **Biz bilan bog'lanish** | Telegram · Instagram · Telefon · Email · Manzil |
| 🛠️ **Admin panel** | Kontent, foydalanuvchilar, Premium, tekshirish navbati |

---

## Texnologiyalar

| Qatlam | Tanlov | Nega |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Server komponentlar — tez va SEO'ga mos |
| Til | **TypeScript** | Xatolarni yozish paytida tutadi |
| Dizayn | **Tailwind CSS v4** | Tez, yengil, dark mode bilan |
| Baza | **Supabase (PostgreSQL)** | Bepul tarif, panel orqali boshqariladi |
| Kirish | **Supabase Auth** | Google OAuth + email OTP tayyor holda |
| Fayllar | **Supabase Storage** | Listening audio, Speaking javoblari |
| Hosting | **Vercel** | Bepul, GitHub'ga ulanadi, avtomatik deploy |

**Nega aynan shu to'plam:** hammasi bepul tarifda boshlanadi, serverni
o'zingiz boshqarmaysiz, va kontentni kod yozmasdan panel orqali
qo'shaverasiz.

---

## Xavfsizlik — qanday himoyalangan

Bu eng muhim qismi. Quyidagilar **ma'lumotlar bazasi darajasida**
(Row Level Security) ta'minlangan, ya'ni brauzerdan aylanib o'tib bo'lmaydi:

- ✅ **To'g'ri javoblar hech qachon brauzerga chiqmaydi** —
  `questions.correct_answer` ustuni oddiy foydalanuvchilar uchun butunlay
  bloklangan. Tekshirish faqat serverdagi `score_attempt()` funksiyasida.
- ✅ **Premium kontent qulflangan** — bepul foydalanuvchi API orqali ham
  Premium test matni yoki maqolasini ololmaydi.
- ✅ **Foydalanuvchi o'ziga Premium bera olmaydi** — `is_premium` va `role`
  ustunlariga yozish huquqi olib tashlangan.
- ✅ **Ballarni qo'lda o'zgartirib bo'lmaydi** — `overall_score`,
  `cefr_level` kabi ustunlarni faqat server funksiyalari yozadi.
- ✅ **O'yin bali serverda qayta hisoblanadi** — brauzerdan kelgan ballga
  ishonilmaydi.
- ✅ **Begona natijani ko'rib bo'lmaydi** — har bir urinish faqat egasiga
  va o'qituvchiga ochiq.
- ✅ **Speaking audiolari yopiq** — faqat egasi va o'qituvchi eshitadi.

Bu qoidalarning barchasi lokal PostgreSQL'da **20 ta test** bilan
tekshirilgan.

---

## Loyiha tuzilishi

```
supabase/
  migrations/
    0001_schema.sql      Jadvallar
    0002_policies.sql    Xavfsizlik qoidalari (RLS)
    0003_functions.sql   Baholash, leaderboard, o'yin mantiqi
    0004_storage.sql     Audio fayllar uchun papkalar
  seed.sql               Demo kontent

src/
  app/
    (site)/              Oddiy sahifalar (header + footer bilan)
      page.tsx           Bosh sahifa
      full-mock/         Full Mock testlar
      latest-questions/  Yillar bo'yicha arxiv
      boost/             Articles + Listening Practice
      vocabulary-battle/ So'z o'yini
      leaderboard/       Reyting
      exam-checking/     Premium imtihon
      tests/[slug]/      Test haqida + boshlash
      results/           Natijalar va tahlil
      premium/           Tariflar va so'rov
      courses/           Offline kurslar
      contact/           Biz bilan bog'lanish
      profile/           Profil, natijalar, sozlamalar
      admin/             Admin va o'qituvchi paneli
    test/[attemptId]/    Test pleyeri (chalg'itmaydigan ko'rinish)
    exam/[attemptId]/    Imtihon pleyeri (ketma-ket, qaytib bo'lmaydi)
    auth/                Kirish/chiqish yo'nalishlari
  components/
    ui/                  Tugma, karta, badge, forma elementlari
    layout/              Header, Footer, menyu
    test/                Test pleyeri, savol turlari, audio, natija
    vocab/               O'yin
    article/             Maqola savollari
    admin/               Admin formalar
    forms/               Premium, kurs, kontakt formalari
    profile/             Profil kartalari
  lib/
    supabase/            Baza klientlari (brauzer / server / admin)
    actions/             Server actions (yozish amallari)
    queries.ts           O'qish so'rovlari
    admin-queries.ts     Admin panel so'rovlari
    types.ts             TypeScript turlari
    constants.ts         Bo'limlar, mavzular, o'yin sozlamalari
```

---

## Buyruqlar

```bash
npm run dev        # Lokal ishga tushirish → http://localhost:3000
npm run build      # Production build (deploy oldidan tekshirish)
npm run start      # Build qilingan saytni ishga tushirish
npm run lint       # Kod sifatini tekshirish
npm run typecheck  # TypeScript xatolarini tekshirish
```

---

## Baholash tizimi

Har bir bo'lim **0–100** ball bilan baholanadi, umumiy ball — o'rtacha
qiymat. CEFR darajasi quyidagicha:

| Umumiy ball | Daraja |
|---|---|
| 75 – 100 | **C1** |
| 60 – 74 | **B2** |
| 45 – 59 | **B1** |
| 30 – 44 | **A2** |
| 0 – 29 | **A1** |

> Misol (hujjatdagi): Listening 62 · Reading 68 · Writing 58 · Speaking 61
> → o'rtacha **62.25** → **B2** ✅

Chegaralarni **Admin panel → Sayt sozlamalari → CEFR chegaralari** dan
o'zgartirish mumkin.

**Reading va Listening** darhol avtomatik baholanadi.
**Writing va Speaking** o'qituvchiga tekshirish navbatiga tushadi.

---

## Vocabulary Battle ball tizimi

| | Ball |
|---|---|
| To'g'ri javob | **+300** |
| Tezlik bonusi | **+200 gacha** (15 soniyadan qancha tez javob bersangiz) |
| Bitta savoldan maksimum | **500** |

Ball **serverda** hisoblanadi — brauzerdan yuborilgan natijaga ishonilmaydi.

---

📖 **To'liq o'rnatish qo'llanmasi: [SETUP.md](./SETUP.md)**
