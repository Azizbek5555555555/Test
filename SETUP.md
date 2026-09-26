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
| **Railway** | Saytni internetga chiqarish | railway.app |

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

> ⚠️ **ZIP qilib yuklab olmang.** ZIP'dan keyin `git pull` ishlamaydi va
> yangilanishlarni ololmaysiz. Faqat `git clone` ishlating.

Git o'rnatilganini tekshiring (bo'lmasa [git-scm.com](https://git-scm.com/downloads)
dan o'rnating va VS Code'ni qayta oching):

```bash
git --version
```

Keyin:

```bash
cd $HOME\Desktop
git clone https://github.com/SIZNING-USERNAME/Test.git multilevel-plus
cd multilevel-plus
npm install
```

> Mac/Linux'da birinchi qator: `cd ~/Desktop`

### ✅ Tekshirish

```bash
git status
```

`On branch main` va `nothing to commit, working tree clean` chiqishi kerak.

### 🌿 Branchlar — qaysi biri nima uchun

| Branch | Vazifasi |
|---|---|
| **`main`** | **Saytning o'zi.** Railway faqat shu branchni internetga chiqaradi. |
| `claude/lucid-franklin-dll1qh` | Claude o'zgarishlarni shu yerga yuboradi. Siz GitHub'da **Pull Request → Merge** qilganingizda ular `main` ga o'tadi. |

**Yangilanishlarni olish** (har safar PR merge qilgandan keyin):

```bash
git checkout main
git pull
```

---

## 2-QADAM · Supabase loyihasini yaratish

1. [supabase.com](https://supabase.com) ga kiring → **Start your project**
2. **New project** tugmasini bosing
3. To'ldiring:
   - **Name:** `multilevel-plus`
   - **Database Password:** kuchli parol o'ylab toping va **saqlab qo'ying**
   - **Region:** `Frankfurt (eu-central-1)` — O'zbekistonga eng yaqin
4. Agar **Security** yoki **Data API** bo'limi chiqsa — **standart holicha
   qoldiring** (Data API yoqilgan bo'lishi kerak)
5. **Create new project** → 1–2 daqiqa kuting

---

## 3-QADAM · Bazani yaratish (eng muhim qadam)

Supabase panelida chap menyudan **SQL Editor** ni oching.

Endi loyihadagi `supabase/` papkasidan **5 ta faylni ketma-ket** ishga
tushirasiz. Har birida: faylni ochib, **butun matnini nusxalang**, SQL Editor
oynasiga qo'ying va **RUN** (yoki `Ctrl+Enter`) bosing.

**Tartibni buzmang!**

| № | Fayl | Nima qiladi |
|---|---|---|
| 1 | `supabase/migrations/0001_schema.sql` | Jadvallarni yaratadi |
| 2 | `supabase/migrations/0002_policies.sql` | Xavfsizlik qoidalari |
| 3 | `supabase/migrations/0003_functions.sql` | Baholash mantiqi |
| 4 | `supabase/migrations/0004_storage.sql` | Audio fayllar uchun papkalar |
| 5 | `supabase/migrations/0005_security_hardening.sql` | Qo'shimcha himoya: soxta natija, o'yinda aldash, Premium so'rovni soxtalashtirishdan |

> 💡 **Bazani oldin yaratgan bo'lsangiz** (1–4 fayllarni avval ishga
> tushirgan bo'lsangiz), faqat **5-faylni** ishga tushirsangiz kifoya —
> mavjud ma'lumotlar o'chmaydi.

Har birida `Success. No rows returned` yozuvi chiqishi kerak.

> ⚠️ **Sariq `NOTICE` xabarlari — bu xato emas.** Ular "bunday narsa yo'q
> ekan, o'tkazib yubordim" degani. Faqat qizil **ERROR** bo'lsa muammo.

> ⚠️ **"Potential issue detected" / "destructive operation" oynasi chiqsa** —
> **Run this query** ni bosing. Supabase fayl ichidagi `drop policy if exists`
> qatorlarini ko'rib ogohlantiradi; bu qatorlar faqat eski qoidani yangisi bilan
> almashtiradi, ma'lumot o'chmaydi.

> ⚠️ **"RLS disabled" / "tables without RLS" ogohlantirishi chiqsa** (1-fayldan
> keyin) — e'tibor bermang. RLS 2-faylda yoqiladi.

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

### ✅ Hammasi to'g'ri ishlaganini tekshirish

SQL Editor'da yangi oynaga shuni qo'yib **RUN** bosing:

```sql
select 'test_sets' as jadval, count(*) from test_sets
union all select 'questions', count(*) from questions
union all select 'articles', count(*) from articles
union all select 'vocab_words', count(*) from vocab_words
union all select 'courses', count(*) from courses
union all select 'buckets', count(*) from storage.buckets;
```

Kutilgan natija:

| jadval | count |
|---|---|
| test_sets | 21 |
| questions | 44 |
| articles | 8 |
| vocab_words | 46 |
| courses | 3 |
| buckets | 2 |

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

Hujjatda asosiy variant — Google account. Uni sozlaymiz. Jami ~15 daqiqa.

> 🧭 **Qanday ishlaydi:** Sayt → Google → **Supabase** → Sayt.
> Google faqat **Supabase manzilini** biladi. Shuning uchun keyin domen
> yoki Railway manzili o'zgarsa, Google'da hech narsa o'zgartirmaysiz —
> faqat Supabase'dagi ro'yxatga yangi manzil qo'shasiz.

### 5.1. Supabase'dan "Callback URL" ni olish

1. Supabase → **Authentication** → **Sign In / Providers**
2. Ro'yxatdan **Google** ni bosing (hali yoqmang)
3. Pastda **Callback URL (for OAuth)** degan qator bor — uni
   **Copy** qiling. U shunday ko'rinishda bo'ladi:

   ```
   https://SIZNING-LOYIHA.supabase.co/auth/v1/callback
   ```

Bu oynani yopmang — 5.3 da qaytamiz.

### 5.2. Google Cloud'da kirish kalitini yaratish

Yangi tab'da [console.cloud.google.com](https://console.cloud.google.com)
ni oching (saytga qaysi Google akkaunt bilan kirsangiz — o'sha egasi bo'ladi).

**a) Loyiha yaratish**
1. Yuqori chapdagi loyiha tanlagich → **New Project**
2. **Project name:** `Multilevel Plus` → **Create**
3. Yaratilgach, yuqoridan aynan shu loyiha tanlanganiga ishonch hosil qiling

**b) Ruxsat oynasi (Branding)**
1. Yuqoridagi qidiruvga `Google Auth Platform` yozing → oching
   (yoki menyu → **APIs & Services** → **OAuth consent screen**)
2. **Get started** tugmasi
3. **App name:** `Multilevel Plus` · **User support email:** emailingiz → **Next**
4. **Audience:** `External` → **Next**
5. **Contact information:** emailingiz → **Next**
6. Shartlarga belgi qo'ying → **Continue** → **Create**

> ⚠️ **Branding** sahifasida **logo YUKLAMANG** — logo qo'yilsa Google
> ilovani qo'lda tekshirishni (bir necha kun/hafta) talab qiladi.
> *App domain* (home page, privacy, terms) maydonlarini bo'sh qoldirsangiz
> bo'ladi. *Authorized domains* da Supabase manzili o'zi paydo bo'ladi —
> tegmang.

**c) Client (kalit) yaratish**
1. Chap menyu → **Clients** → **+ Create client**
2. **Application type:** `Web application`
3. **Name:** `Multilevel Plus Web`
4. **Authorized redirect URIs** → **+ Add URI** → 5.1 da nusxalagan
   Supabase manzilini qo'ying
5. **Create**
6. Chiqqan oynadan **Client ID** va **Client secret** ni nusxalang
   (secret'ni hech kimga yubormang, GitHub'ga yozmang)

**d) Test foydalanuvchilarni qo'shish (hozircha)** ⚠️ muhim

Yangi ilova **Testing** holatida bo'ladi: faqat ro'yxatdagi Gmail'lar kira
oladi (100 tagacha). Google **Publish app** uchun sayt manzili, maxfiylik
siyosati va shartlar havolasini talab qiladi — ular sayt Railway'ga
chiqqandan keyin bo'ladi (9.7-qadam). Hozircha:

1. Chap menyu → **Audience** → **Test users** → **+ Add users**
2. O'zingizning va sinab ko'radigan odamlarning Gmail manzillarini yozing →
   **Save**

> Ro'yxatda yo'q odamga *"Access blocked: ... has not completed the Google
> verification process"* chiqadi — bu normal, 9.7-qadamda hal bo'ladi.

### 5.3. Supabase'ga ulash

1. Supabase'dagi Google oynasiga qayting
2. **Enable Sign in with Google** — yoqing
3. **Client IDs** ga — Client ID, **Client Secret** ga — secret
4. **Save**

### 5.4. Supabase'ga "qaytish manzili"ni aytish ⚠️

Buni qilmasangiz, Google'dan keyin sayt o'rniga xato sahifa chiqadi.

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL:** hozircha `http://localhost:3000` (Railway'dan keyin
   9.5-qadamda o'zgartirasiz) → **Save changes**
3. **Redirect URLs** → **Add URL** → quyidagini kiriting → **Save URLs**

   ```
   http://localhost:3000/**
   ```

### 5.5. Sinab ko'rish

1. `npm run dev` ishlab turgan bo'lsin
2. http://localhost:3000/login → **Google bilan kirish**
3. Akkaunt tanlang → saytga qaytasiz, yuqori o'ng burchakda rasmingiz chiqadi
4. Supabase → **Authentication → Users** da siz paydo bo'lasiz,
   **Table Editor → profiles** da ismingiz va rasmingiz yoziladi

---

## 6-QADAM · Email orqali 6 xonali kod yuborishni sozlash

Hujjatda: *"Foydalanuvchining emailiga tasdiqlash kodi keladi"*.

Supabase sukut bo'yicha **havola** yuboradi. Uni **kod**ga o'zgartiramiz:

1. Supabase → **Authentication** → **Emails** → **Templates**
2. **Magic Link** shablonini tanlang
3. Matndagi `{{ .ConfirmationURL }}` o'rniga `{{ .Token }}` yozing.
4. **Confirm signup** shablonini ham tanlab, xuddi shunday qiling
   (saytga **birinchi marta** kirayotgan odamga aynan shu shablon boradi).

Masalan, ikkala shablonni ham butunlay quyidagiga almashtiring:

```html
<h2>Multilevel Plus — tasdiqlash kodi</h2>
<p>Saytga kirish uchun quyidagi kodni kiriting:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:8px">{{ .Token }}</p>
<p>Kod 1 soat davomida amal qiladi.</p>
<p>Agar bu siz bo'lmasangiz, bu xatni e'tiborsiz qoldiring.</p>
```

5. Har birida **Save**

> ℹ️ Kod uzunligi: **Authentication → Sign In / Providers → Email →
> Email OTP Length** — `6` qilib qo'ying (sayt 6–10 xonali kodni qabul
> qiladi, lekin sahifadagi yozuvlar "6 xonali" deydi).

> ⚠️ **Supabase'ning o'z pochta xizmati faqat sinov uchun:** u kod faqat
> **loyiha jamoasi a'zolarining** emailiga (ya'ni sizga) yuboradi va soatiga
> bir necha xat bilan cheklangan. Boshqa odamlarga email kodi borishi uchun
> o'z pochta xizmatingizni ulash **shart**: **Authentication → Emails →
> SMTP Settings** (masalan [Resend](https://resend.com) — bepul tarifi bor).
> Google orqali kirish bunga bog'liq emas — u hamma uchun ishlaydi.

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

## 9-QADAM · Saytni internetga chiqarish (Railway)

### 9.1. Kod GitHub'da tayyor

Kod allaqachon GitHub'dagi **`main`** branchda turibdi — hech narsa
yuklash shart emas. Railway kodni to'g'ridan-to'g'ri o'sha yerdan oladi.

### 9.2. Railway'da loyiha yaratish

1. [railway.app](https://railway.app) ga kiring → **Login with GitHub**
2. **New Project** → **Deploy from GitHub repo**
3. Repozitoriyangizni tanlang (birinchi marta bo'lsa Railway'ga GitHub
   ruxsatini berasiz)
4. Railway darhol build boshlaydi — **uni to'xtatishingiz shart emas**,
   keyingi qadamda o'zgaruvchilarni qo'shib qayta ishga tushiramiz
5. **Branchni tekshiring:** loyiha → **Settings** → **Source** →
   **Branch** = `main` bo'lishi kerak

### 9.3. Muhit o'zgaruvchilarini qo'shish ⚠️ ENG MUHIM

Railway'da loyihangiz ustiga bosing → **Variables** → **New Variable**

Uchta o'zgaruvchini qo'shing (`.env.local` dagi qiymatlarning aynan
o'zi):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon kaliti |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role kaliti |

> 💡 **Tezroq usul:** **Variables** → **Raw Editor** tugmasini bosing va
> `.env.local` faylingizning mazmunini (`NEXT_PUBLIC_SITE_URL` qatorisiz)
> to'g'ridan-to'g'ri qo'ying.

> ⚠️ **`NEXT_PUBLIC_SITE_URL` ni qo'shmang** — Railway bergan domen
> avtomatik aniqlanadi. Uni faqat o'z domeningizni ulaganingizda yozasiz.

> ⚠️ **Nega bu muhim:** `NEXT_PUBLIC_` bilan boshlanadigan o'zgaruvchilar
> **build paytida** kodga yoziladi. Ularni qo'shmasdan build qilsangiz,
> sayt ochiladi-yu, lekin "Ma'lumotlar bazasi ulanmagan" deb turadi.
> Shuning uchun qo'shgandan keyin **albatta qayta deploy qiling**.

O'zgaruvchilarni saqlagach: **Deployments** → yuqoridagi **⋮** →
**Redeploy**.

### 9.4. Saytga manzil (domen) olish

1. Railway → loyihangiz → **Settings** → **Networking**
2. **Generate Domain** tugmasini bosing
3. Sizga shunday manzil beriladi:
   `https://multilevel-plus-production.up.railway.app`
4. Bu manzilni nusxalab oling

> Agar Railway port so'rasa — **Deployments → oxirgi deploy → Deploy Logs**
> ni oching va `- Local: http://localhost:XXXX` qatoridagi raqamni kiriting
> (odatda **8080**). ⚠️ 3000 emas — Railway saytga o'z portini beradi,
> noto'g'ri port kiritilsa sayt *502 Bad Gateway* ko'rsatadi.

### 9.5. Supabase'ga yangi manzilni aytish

Bu qadamni **o'tkazib yubormang**, aks holda Google orqali kirish
ishlamaydi.

Supabase → **Authentication** → **URL Configuration**:

- **Site URL:**
  ```
  https://sizning-sayt.up.railway.app
  ```
- **Redirect URLs** ga ikkalasini ham qo'shing:
  ```
  https://sizning-sayt.up.railway.app/**
  http://localhost:3000/**
  ```

**Save** bosing.

### 9.6. Tekshirish

Railway bergan manzilni brauzerda oching. Sayt ochilishi va sariq
ogohlantirish **bo'lmasligi** kerak. Google orqali kirib ko'ring.

> ✅ Bundan keyin `main` branch o'zgarganda (masalan, Pull Request merge
> qilganingizda) Railway saytni **avtomatik** yangilaydi.

---

### 9.7. Google login'ni hamma uchun ochish (Publish app)

Sayt endi real manzilda (masalan `https://multilevel-plus-production.up.railway.app`).

1. Google Cloud → **Google Auth Platform** → **Branding**:
   - **Application home page:** `https://SIZNING-MANZIL`
   - **Application privacy policy link:** `https://SIZNING-MANZIL/privacy`
   - **Application terms of service link:** `https://SIZNING-MANZIL/terms`
   - **Authorized domains** → **+ Add domain** → manzilingiz, `https://`
     siz (masalan `multilevel-plus-production.up.railway.app`)
   - **Logo yuklamang** → **Save**
2. **Audience** → **Publish app** → **Confirm** → holat **In production**

Endi istalgan Gmail egasi kira oladi. O'z domeningizni ulaganingizda
shu havolalarni yangi domen bilan almashtirasiz.

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

| Nima chiqdi | Sababi va yechimi |
|---|---|
| `Unsupported provider: provider is not enabled` | Supabase'da Google yoqilmagan yoki **Save** bosilmagan (5.3) |
| Google: `Error 400: redirect_uri_mismatch` | Google Cloud'dagi **Authorized redirect URI** Supabase'dagi Callback URL bilan harfma-harf bir xil emas (oxirida `/` yoki bo'sh joy bo'lmasin) (5.2-c) |
| Google: `Access blocked` / `has not completed the Google verification process` | Ilova **Testing** holatida va bu Gmail **Test users** ro'yxatida yo'q (5.2-d). Sayt Railway'da bo'lsa — **Publish app** (9.7) |
| Google: `invalid_client` | Client ID yoki secret noto'g'ri nusxalangan (5.3) |
| Kirgandan keyin `localhost:3000` o'rniga boshqa sahifa yoki xato | Supabase → **URL Configuration → Redirect URLs** ga `http://localhost:3000/**` qo'shilmagan (5.4) |

Google Cloud'dagi o'zgarishlar 5 daqiqagacha kuchga kirishi mumkin.
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
<summary><b>O'yinda "start_vocab_round" / testda "permission denied for table attempts" xatosi</b></summary>

`0005_security_hardening.sql` hali ishga tushirilmagan. Supabase →
**SQL Editor** da shu faylni ishga tushiring (3-qadam, 5-fayl) va
`/setup-check` sahifasini qayta oching.
</details>

<details>
<summary><b>"Bu test hali tayyor emas" deb turibdi</b></summary>

Bu testda hali bo'lim (Part) yo'q. **Admin panel → Testlar** → testni
tanlang → bo'lim va savollar qo'shing. Bo'sh testni boshlab bo'lmaydi —
bu ataylab qilingan.
</details>

<details>
<summary><b>Admin panelda savollarning javoblari ko'rinmayapti</b></summary>

`SUPABASE_SERVICE_ROLE_KEY` to'ldirilmagan. `.env.local` ga qo'shing va
serverni qayta ishga tushiring. Railway'da ham shu o'zgaruvchini
**Variables** bo'limiga qo'shing va qayta deploy qiling.
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
<summary><b>Railway manzili "502 Bad Gateway" / "Application failed to respond"</b></summary>

Railway → **Settings → Networking** da domen yonidagi port saytning
haqiqiy portiga mos emas. **Deploy Logs** dagi `Local: http://localhost:XXXX`
raqamini ko'ring va domenni tahrirlab, shu portni qo'ying (odatda 8080).
</details>

<details>
<summary><b>Railway'da build xato bermoqda</b></summary>

Avval lokal tekshiring:

```bash
npm run build
```

Agar lokal ishlasa, Railway → **Variables** da **3 ta** o'zgaruvchi
qo'shilganini tekshiring. Xato matnini ko'rish uchun:
Railway → **Deployments** → oxirgi deploy → **View Logs**.
</details>

---

## 📞 Keyingi qadamlar

Sayt ishga tushgach:

1. **Sayt sozlamalari** dan o'z Telegram/Instagram/telefoningizni yozing
2. Demo kontentni o'chirib, o'z testlaringizni qo'shing
3. O'qituvchilarga `teacher` roli bering
4. O'z domeningizni Railway → **Settings → Networking → Custom Domain**
   dan ulang (keyin `NEXT_PUBLIC_SITE_URL` ni ham qo'shing va Supabase
   Redirect URLs ro'yxatiga yangi domenni kiriting)

Omad! 🎓
