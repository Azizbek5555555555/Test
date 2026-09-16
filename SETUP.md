# 🚀 MULTILEVEL PLUS — to'liq o'rnatish qo'llanmasi

Bu qo'llanma **noldan boshlab** saytni ishga tushirishni qadam-baqadam
tushuntiradi. Dasturlashni bilmasangiz ham, shu ketma-ketlikni bajarsangiz
sayt ishlaydi.

**Umumiy vaqt: ~40 daqiqa.**

---

## 📋 Nima kerak bo'ladi

Uchta bepul akkaunt (hammasi bepul tarifda yetarli):

| Xizmat | Nima uchun | Manzil |
|---|---|---|
| **GitHub** | Kod saqlanadi | github.com |
| **Supabase** | Baza + ro'yxatdan o'tish + fayllar | supabase.com |
| **Vercel** | Saytni internetga chiqarish | vercel.com |

Va kompyuteringizda:
- **Node.js 20 yoki undan yuqori** — [nodejs.org](https://nodejs.org) dan
  "LTS" versiyasini yuklab oling va o'rnating.

Tekshirish uchun terminal (Windows'da "PowerShell") ochib yozing:

```bash
node -v
```

`v20.x.x` yoki `v22.x.x` chiqsa — hammasi joyida.

---

## 1-QADAM · Loyihani kompyuteringizga tushirish

Terminal oching va yozing (`SIZNING-USERNAME` o'rniga o'z GitHub
foydalanuvchi nomingizni qo'ying):

```bash
git clone https://github.com/SIZNING-USERNAME/Test.git multilevel-plus
cd multilevel-plus
npm install
```

`npm install` 1–2 daqiqa davom etadi. Xato bo'lmasa — davom etamiz.

---

## 2-QADAM · Supabase loyihasini yaratish

1. [supabase.com](https://supabase.com) ga kiring → **Start your project**
2. **New project** tugmasini bosing
3. To'ldiring:
   - **Name:** `multilevel-plus`
   - **Database Password:** kuchli parol o'ylab toping va **saqlab qo'ying**
   - **Region:** `Frankfurt (eu-central-1)` — O'zbekistonga eng yaqin
4. **Create new project** → 1–2 daqiqa kuting

---

## 3-QADAM · Bazani yaratish (eng muhim qadam)

Supabase panelida chap menyudan **SQL Editor** ni oching.

Endi loyihadagi `supabase/` papkasidan **4 ta faylni ketma-ket** ishga
tushirasiz. Har birida: faylni ochib, **butun matnini nusxalang**, SQL Editor
oynasiga qo'ying va **RUN** (yoki `Ctrl+Enter`) bosing.

**Tartibni buzmang!**

| № | Fayl | Nima qiladi |
|---|---|---|
| 1 | `supabase/migrations/0001_schema.sql` | Jadvallarni yaratadi |
| 2 | `supabase/migrations/0002_policies.sql` | Xavfsizlik qoidalari |
| 3 | `supabase/migrations/0003_functions.sql` | Baholash mantiqi |
| 4 | `supabase/migrations/0004_storage.sql` | Audio fayllar uchun papkalar |

Har birida `Success. No rows returned` yozuvi chiqishi kerak.

> ⚠️ **Sariq `NOTICE` xabarlari — bu xato emas.** Ular "bunday narsa yo'q
> ekan, o'tkazib yubordim" degani. Faqat qizil **ERROR** bo'lsa muammo.

### Demo kontentni qo'shish (tavsiya etiladi)

Sayt bo'sh ko'rinmasligi uchun namunaviy testlar, maqolalar, so'zlar va
kurslarni qo'shamiz:

5. `supabase/seed.sql` faylini ham xuddi shunday ishga tushiring.

Bundan keyin saytda:
- 4 ta Full Mock test (2 tasi bepul, 2 tasi Premium)
- 12 ta "Oxirgi tushgan savollar" to'plami (3 yil × 4 bo'lim)
- 2 ta Exam Full Checking imtihoni
- 8 ta maqola (har xil mavzuda)
- 4 ta so'z to'plami (46 ta so'z)
- 3 ta offline kurs

paydo bo'ladi. Keyin ularni o'chirib, o'zingiznikini qo'shishingiz mumkin.

---

## 4-QADAM · Kalitlarni olish va `.env.local` yaratish

Supabase'da: **Project Settings** (pastdagi ⚙️) → **API**

U yerda 3 ta narsa bor:

| Supabase'dagi nomi | Bizdagi nomi |
|---|---|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon / public** kaliti | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** kaliti (yashirin, "Reveal" bosing) | `SUPABASE_SERVICE_ROLE_KEY` |

Endi loyiha papkasida `.env.example` faylining nusxasini oling va nomini
`.env.local` qiling:

```bash
cp .env.example .env.local
```

> Windows'da: `copy .env.example .env.local`

`.env.local` ni bloknotda oching va qiymatlarni to'ldiring:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> 🔐 **`service_role` kaliti — parol kabi.** Uni hech kimga bermang,
> skrinshotga olmang, GitHub'ga yuklamang. U barcha himoyani chetlab o'tadi.
> (Fayl allaqachon `.gitignore` ichida, ya'ni GitHub'ga tushmaydi.)

---

## 5-QADAM · Google orqali kirishni yoqish

Hujjatda asosiy variant — Google account. Uni sozlaymiz.

### 5.1. Google Cloud'da ilova yaratish

1. [console.cloud.google.com](https://console.cloud.google.com) ga kiring
2. Yuqoridan **New Project** → nom: `Multilevel Plus` → **Create**
3. Chap menyu → **APIs & Services** → **OAuth consent screen**
   - **External** → **Create**
   - **App name:** `Multilevel Plus`
   - **User support email:** emailingiz
   - **Developer contact:** emailingiz
   - **Save and Continue** → oxirigacha → **Back to Dashboard**
4. **APIs & Services** → **Credentials** → **Create Credentials** →
   **OAuth client ID**
   - **Application type:** `Web application`
   - **Name:** `Multilevel Plus Web`
   - **Authorized redirect URIs** → **ADD URI** va quyidagini kiriting:

     ```
     https://SIZNING-LOYIHA.supabase.co/auth/v1/callback
     ```

     > `SIZNING-LOYIHA` o'rniga Supabase URL'ingizdagi qismni qo'ying.
     > Masalan: `https://abcdefghijklm.supabase.co/auth/v1/callback`

   - **Create**
5. Chiqqan **Client ID** va **Client Secret** ni nusxalab oling

### 5.2. Supabase'ga ulash

1. Supabase → **Authentication** → **Sign In / Providers**
2. **Google** ni toping → yoqing
3. **Client ID** va **Client Secret** ni qo'ying → **Save**

---

## 6-QADAM · Email orqali 6 xonali kod yuborishni sozlash

Hujjatda: *"Foydalanuvchining emailiga tasdiqlash kodi keladi"*.

Supabase sukut bo'yicha **havola** yuboradi. Uni **kod**ga o'zgartiramiz:

1. Supabase → **Authentication** → **Emails** → **Templates**
2. **Magic Link** shablonini tanlang
3. Matndagi `{{ .ConfirmationURL }}` o'rniga `{{ .Token }}` yozing.

Masalan, shablonni butunlay quyidagiga almashtiring:

```html
<h2>Multilevel Plus — tasdiqlash kodi</h2>
<p>Saytga kirish uchun quyidagi kodni kiriting:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:8px">{{ .Token }}</p>
<p>Kod 1 soat davomida amal qiladi.</p>
<p>Agar bu siz bo'lmasangiz, bu xatni e'tiborsiz qoldiring.</p>
```

4. **Save**

> ℹ️ Bepul tarifda Supabase soatiga ~3 ta email yuboradi — sinov uchun
> yetarli. Haqiqiy foydalanuvchilar ko'payganda **Authentication → Emails →
> SMTP Settings** dan o'z pochta xizmatingizni (masalan
> [Resend](https://resend.com) yoki Gmail SMTP) ulaysiz.

---

## 7-QADAM · Saytni birinchi marta ishga tushirish

```bash
npm run dev
```

Brauzerda oching: **http://localhost:3000**

Sayt ochilishi kerak. Yuqoridagi sariq ogohlantirish yo'qolgan bo'lsa —
baza to'g'ri ulangan. 🎉

Endi **Kirish** tugmasini bosib, Google orqali ro'yxatdan o'ting.

---

## 8-QADAM · O'zingizni ADMIN qilish

Ro'yxatdan o'tganingizdan keyin Supabase → **SQL Editor** ga qayting va
quyidagini ishga tushiring (emailni o'zingiznikiga almashtiring):

```sql
update public.profiles
set role = 'admin', is_premium = true
where email = 'sizning@email.com';
```

Endi saytda profil rasmingizni bosing → **Admin panel** ko'rinadi.

### Rollar nimani anglatadi

| Rol | Nima qila oladi |
|---|---|
| `student` | Testlarni ishlaydi, o'ynaydi, natijasini ko'radi |
| `teacher` | + Writing/Speaking ishlarini tekshiradi, kontent qo'shadi |
| `admin` | + Premium beradi, rollarni o'zgartiradi, sozlamalarni tahrirlaydi |

---

## 9-QADAM · Saytni internetga chiqarish (Vercel)

### 9.1. Kodni GitHub'ga yuklash

```bash
git add .
git commit -m "Multilevel Plus platformasi"
git push
```

### 9.2. Vercel'ga ulash

1. [vercel.com](https://vercel.com) → GitHub bilan kiring
2. **Add New** → **Project** → repozitoriyangizni tanlang → **Import**
3. **Environment Variables** bo'limiga `.env.local` dagi **4 ta qatorni**
   ham qo'shing:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon kaliti |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role kaliti |
   | `NEXT_PUBLIC_SITE_URL` | `https://sizning-sayt.vercel.app` |

4. **Deploy** → 2–3 daqiqa kuting

### 9.3. Supabase'ga yangi manzilni aytish

Bu qadamni **o'tkazib yubormang**, aks holda Google orqali kirish ishlamaydi.

Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `https://sizning-sayt.vercel.app`
- **Redirect URLs** ga ikkalasini ham qo'shing:
  ```
  https://sizning-sayt.vercel.app/**
  http://localhost:3000/**
  ```

**Save**.

> Keyinchalik o'z domeningizni (masalan `multilevelplus.uz`) ulasangiz,
> uni ham shu ro'yxatga qo'shing va `NEXT_PUBLIC_SITE_URL` ni yangilang.

---

## 10-QADAM · Kontent qo'shishni boshlash

Admin panel → chap menyu:

### 📝 Testlar

1. **Testlar** → **➕ Yangi test qo'shish**
   - **Turkum:** `Full Mock` / `Oxirgi savollar` / `General English` /
     `Exam Checking`
   - **Slug:** URL manzili, masalan `full-mock-5`
   - **Premium:** qulflansinmi yoki bepul bo'lsinmi
2. Test yaratilgach → **Tahrirlash** → **➕ Yangi bo'lim qo'shish**
   - Full Mock uchun 4 ta bo'lim: Listening, Reading, Writing, Speaking
   - Reading bo'limiga **matn**ni HTML sifatida qo'ying
   - Listening bo'limiga **audio manzili**ni qo'ying (pastga qarang)
3. Har bo'lim ichida → **➕ Savol qo'shish**

#### Savol turlari va javob formati

| Savol turi | Variantlar (JSON) | To'g'ri javob (JSON) |
|---|---|---|
| Multiple choice | `["London","Paris","Rome"]` | `"Paris"` |
| True/False/NG | `["TRUE","FALSE","NOT GIVEN"]` | `"FALSE"` |
| Gap filling | `[]` | `["seven","7"]` ← bir necha variant qabul qilinadi |
| Qisqa javob | `[]` | `["hippocampus"]` |
| Bir nechta javob | `["A","B","C","D"]` | `["A","C"]` |
| Matching | `[{"left":"1","label":"Singapore","right":["Rooftop","Community"]}]` | `{"1":"Rooftop"}` |
| Essay (Writing) | `[]` | *bo'sh qoldiring* |
| Speaking topic | `[]` | *bo'sh qoldiring* |

> 💡 Gap filling va qisqa javobda **katta-kichik harf va ortiqcha probellar
> hisobga olinmaydi** — `"Seven"`, `"seven "` va `"SEVEN"` bir xil qabul
> qilinadi.

### 🎧 Audio yuklash

1. Supabase → **Storage** → **audio** papkasi
2. **Upload file** → mp3 faylni yuklang
3. Fayl ustiga bosing → **Get URL** → nusxalang
4. Admin panel → test bo'limi → **Audio manzili** maydoniga qo'ying

### 📰 Maqolalar

**Maqolalar** → **➕ Yangi maqola** →
matnni HTML sifatida yozing (`<p>`, `<h2>`, `<ul>`), yangi so'zlarni JSON
sifatida qo'shing, keyin ichiga savollar qo'shing.

### 📘 Vocabulary

**Vocabulary** → to'plam yarating → ichiga so'zlarni qo'shing.
Har bir so'zda 4 ta variant va **to'g'ri variant raqami** (0, 1, 2 yoki 3)
ko'rsatiladi.

### 🏫 Kurslar va ⚙️ Sozlamalar

- **Kurslar** — offline kurslarni qo'shasiz
- **Sayt sozlamalari** — Telegram, Instagram, telefon, manzil, Premium
  narxlari va CEFR chegaralarini shu yerdan o'zgartirasiz

---

## 11-QADAM · Premium berish

Ikki yo'l bor:

**A) Foydalanuvchi so'rov yuboradi:**
sayt → **Premium** → tarif tanlaydi → so'rov yuboradi →
Admin panel → **Premium so'rovlar** → **✅ Tasdiqlash**

**B) To'g'ridan-to'g'ri:**
Admin panel → **Foydalanuvchilar** → kerakli odamni toping →
muddatni tanlang → **Premium berish**

---

## ❓ Muammolar va yechimlar

<details>
<summary><b>"Ma'lumotlar bazasi hali ulanmagan" ogohlantirishi turibdi</b></summary>

`.env.local` fayli noto'g'ri joyda yoki bo'sh. Tekshiring:
- Fayl **loyihaning ildiz papkasida** (`package.json` yonida) bo'lishi kerak
- Nomi aynan `.env.local` (oxirida `.txt` bo'lmasin)
- O'zgartirgandan keyin serverni qayta ishga tushiring (`Ctrl+C`, keyin
  `npm run dev`)
</details>

<details>
<summary><b>Google orqali kirish ishlamayapti</b></summary>

1. Google Cloud'dagi **Authorized redirect URI** aynan shunday bo'lsin:
   `https://SIZNING-LOYIHA.supabase.co/auth/v1/callback`
2. Supabase → **Authentication → URL Configuration** da sayt manzili
   qo'shilganini tekshiring
3. Google Cloud'da o'zgartirish 5 daqiqagacha kuchga kiradi
</details>

<details>
<summary><b>Email kodi kelmayapti</b></summary>

- Spam papkasini tekshiring
- Supabase bepul tarifida soatiga ~3 ta email chegarasi bor
- 6-qadamdagi shablonda `{{ .Token }}` borligiga ishonch hosil qiling
- Doimiy yechim: **Authentication → Emails → SMTP Settings** dan o'z pochta
  xizmatingizni ulang
</details>

<details>
<summary><b>Admin panelda savollarning javoblari ko'rinmayapti</b></summary>

`SUPABASE_SERVICE_ROLE_KEY` to'ldirilmagan. `.env.local` ga qo'shing va
serverni qayta ishga tushiring. Vercel'da ham shu o'zgaruvchini qo'shing.
</details>

<details>
<summary><b>Premium bera olmayapman</b></summary>

- Rolingiz `admin` ekanini tekshiring (8-qadam)
- `SUPABASE_SERVICE_ROLE_KEY` sozlanganini tekshiring
</details>

<details>
<summary><b>Speaking audiosi o'qituvchiga eshitilmayapti</b></summary>

- `0004_storage.sql` ishga tushirilganini tekshiring
- Supabase → **Storage** da `speaking` papkasi borligini ko'ring
- `SUPABASE_SERVICE_ROLE_KEY` sozlangan bo'lishi kerak
</details>

<details>
<summary><b>Vercel'da build xato bermoqda</b></summary>

Avval lokal tekshiring:

```bash
npm run build
```

Agar lokal ishlasa, Vercel'da **barcha 4 ta** muhit o'zgaruvchisi
qo'shilganini tekshiring.
</details>

---

## 📞 Keyingi qadamlar

Sayt ishga tushgach:

1. **Sayt sozlamalari** dan o'z Telegram/Instagram/telefoningizni yozing
2. Demo kontentni o'chirib, o'z testlaringizni qo'shing
3. O'qituvchilarga `teacher` roli bering
4. O'z domeningizni Vercel → **Settings → Domains** dan ulang

Omad! 🎓
