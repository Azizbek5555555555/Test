# 🔐 levelxenglish — xavfsizlik bo'yicha qo'llanma

Bu fayl saytda qanday himoyalar borligini va **siz** nimalarni qilishingiz
kerakligini tushuntiradi. Xavfsizlik — bir martalik ish emas, odat.

---

## 1. Saytda qilingan himoyalar (kod va baza)

| # | Himoya | Nimadan saqlaydi | Qayerda |
|---|---|---|---|
| 1 | **RLS** (Row Level Security) — har jadvalda | O'quvchi boshqa odamning natijasini, to'lovini, javoblarini ko'ra olmaydi | `supabase/migrations/0002`, `0005` |
| 2 | **Rollar**: student / teacher / admin | O'qituvchi pul va foydalanuvchilarni ko'rmaydi; admin sahifalari serverda tekshiriladi | `src/proxy.ts`, `src/lib/auth.ts` |
| 3 | **Ballar serverda hisoblanadi** | Brauzerda ballni "o'zgartirib" yuborish ishlamaydi | `score_attempt`, `start_vocab_round` |
| 4 | **To'lov imzolari tekshiriladi** (Payme/Click) | Soxta "to'landi" so'rovi bilan Premium olib bo'lmaydi | `src/app/api/payments/*` |
| 5 | **Content Security Policy (CSP)** + nonce | Saytga tiqilgan begona skript bajarilmaydi (XSS) | `src/proxy.ts` |
| 6 | **Xavfsizlik sarlavhalari** (HSTS, nosniff, X-Frame-Options...) | Faqat HTTPS; saytni boshqa sayt ichiga joylab aldash (clickjacking) mumkin emas | `next.config.ts` |
| 7 | **HTML tozalash** (sanitize) | Maqola/test matniga `<script>` yoki `onerror=` qo'shib bo'lmaydi | `src/lib/sanitize.ts` |
| 8 | **Spam himoyasi** — 3 qatlam | Bot formalarni to'ldirib tashlay olmaydi | `0009_antispam.sql`, `src/lib/rate-limit.ts` |
| 9 | **Maxfiy kalitlar faqat serverda** | `SUPABASE_SERVICE_ROLE_KEY` brauzerga hech qachon chiqmaydi, GitHub'da yo'q | Railway → Variables |
| 10 | **Paketlar yangilangan** (`npm audit` — 0 ta zaiflik) | Next.js'dagi ma'lum teshiklar yopilgan | `package.json` |

### Spam himoyasi qanday ishlaydi (misol sifatida)
1. **Bot-tuzoq (honeypot):** formada odam ko'rmaydigan maydon bor. Bot uni to'ldiradi →
   server botga "yuborildi" deydi, lekin hech narsa saqlamaydi.
2. **IP limiti:** bitta manzildan 10 daqiqada 3 tadan ortiq xabar yuborib bo'lmaydi.
3. **Baza to'sig'i:** bazaga to'g'ridan-to'g'ri yozish yopilgan; bir xil telefon/emaildan
   ko'p yozuv kelsa, bazaning o'zi rad etadi.

---

## 2. SIZ qilishingiz kerak bo'lgan ishlar (eng muhimi!)

Saytni buzishning eng oson yo'li — kodni emas, **sizning akkauntingizni** buzish.
Har bir akkauntda **2 bosqichli tasdiqlash (2FA)** yoqing:

| Akkaunt | Qayerda yoqiladi |
|---|---|
| **Google** (Gmail) | myaccount.google.com → Security → 2-Step Verification |
| **GitHub** | Settings → Password and authentication → Two-factor authentication |
| **Supabase** | Account → Security → Multi-factor authentication |
| **Railway** | Account Settings → Security → Two-Factor Authentication |
| **Hostinger** | Profile → Security → Two-factor authentication |
| **Resend** | Settings → Account → Two-factor authentication |

Ilova sifatida **Google Authenticator** yoki **Microsoft Authenticator** dan foydalaning
(SMS'dan ko'ra ishonchli). Zaxira kodlarini (backup codes) yozib, xavfsiz joyda saqlang.

### Kalitlar bilan ishlash qoidalari
- Kalitlarni (`service_role`, Resend API key, Payme/Click kalitlari) **hech qachon**
  chatga, Telegram'ga, skrinshotga, GitHub'ga qo'ymang. Ular faqat Railway → Variables'da.
- Kalit tasodifan oshkor bo'lsa — darhol **yangisini yarating** (rotate) va eskisini o'chiring.
- Odam ketsa (masalan, o'qituvchi) — admin panelda rolini **student** qiling.

### Muntazam tekshiruv (oyiga 1 marta, 10 daqiqa)
1. Supabase → **Advisors → Security Advisor** — ogohlantirishlar bo'lmasligi kerak.
2. Admin → **Foydalanuvchilar** — begona admin/o'qituvchi yo'qmi?
3. Railway → **Deployments** — notanish deploy yo'qmi?
4. GitHub → repo → **Security** — Dependabot ogohlantirishlari.

### Zaxira nusxa (backup)
Supabase bepul tarifida avtomatik zaxira yo'q. Haqiqiy to'lovlar boshlanganda
**Pro tarif** ($25/oy, kunlik zaxira) tavsiya etiladi. Ungacha haftada bir marta:
Supabase → **Database → Backups** yoki SQL Editor'dan muhim jadvallarni CSV qilib yuklab oling.

---

## 3. Yangi o'zgarishlarni ishga tushirish

Spam himoyasi uchun Supabase → **SQL Editor** da bir marta ishga tushiring:
`supabase/migrations/0009_antispam.sql` (qayta ishga tushirish xavfsiz).
