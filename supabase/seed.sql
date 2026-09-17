-- ============================================================================
-- MULTILEVEL PLUS — DEMO KONTENT (seed)
--
-- Bu fayl saytni "tirik" ko'rsatish uchun namunaviy kontent qo'shadi.
-- Keyinchalik Admin panel orqali o'z testlaringizni qo'shasiz.
-- Qayta ishga tushirsa ham xato bermaydi (on conflict do update).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SAYT SOZLAMALARI
-- ----------------------------------------------------------------------------
insert into public.site_settings (key, value) values
  ('contact', $json$
    {
      "telegram": "https://t.me/multilevelplus",
      "telegram_label": "@multilevelplus",
      "instagram": "https://instagram.com/multilevelplus",
      "instagram_label": "@multilevelplus",
      "phone": "+998 90 123 45 67",
      "phone_2": "+998 71 200 00 00",
      "email": "info@multilevelplus.uz",
      "address": "Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko'chasi 12",
      "map_url": "https://maps.google.com/?q=Tashkent",
      "working_hours": "Dushanba – Shanba, 09:00 – 20:00"
    }
  $json$::jsonb),
  ('cefr_bands', '{"C1": 75, "B2": 60, "B1": 45, "A2": 30}'::jsonb),
  ('premium_plans', $json$
    [
      { "id": "monthly",   "title": "1 oylik",  "months": 1,  "amount": 99000,  "note": "Sinab ko'rish uchun" },
      { "id": "quarterly", "title": "3 oylik",  "months": 3,  "amount": 249000, "note": "Eng ko'p tanlanadi", "popular": true },
      { "id": "yearly",    "title": "12 oylik", "months": 12, "amount": 790000, "note": "Eng foydali" }
    ]
  $json$::jsonb),
  ('payment', $json$
    {
      "card_number": "8600 1234 5678 9012",
      "card_owner": "MULTILEVEL PLUS",
      "instruction": "To'lovni amalga oshirgach, chek rasmini Telegram orqali yuboring. Admin 30 daqiqa ichida Premium ni faollashtiradi."
    }
  $json$::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ============================================================================
-- 1) FULL MOCK TESTLAR  (hujjat: 3-bo'lim)
-- ============================================================================
insert into public.test_sets
  (id, slug, title, description, category, section, level, duration_minutes, is_premium, published, order_index)
values
  ('a0000000-0000-4000-8000-000000000001', 'full-mock-1',
   'Full Mock Test 1',
   'To''liq Multilevel mock test: Reading, Listening, Writing va Speaking bo''limlari.',
   'full_mock', null, 'B1–C1', 180, false, true, 1),
  ('a0000000-0000-4000-8000-000000000002', 'full-mock-2',
   'Full Mock Test 2',
   'Ikkinchi to''liq mock test. Qiyinlik darajasi: o''rta–yuqori.',
   'full_mock', null, 'B1–C1', 180, false, true, 2),
  ('a0000000-0000-4000-8000-000000000003', 'full-mock-3',
   'Full Mock Test 3',
   'Uchinchi to''liq mock test.',
   'full_mock', null, 'B2–C1', 180, true, true, 3),
  ('a0000000-0000-4000-8000-000000000004', 'full-mock-4',
   'Full Mock Test 4',
   'To''rtinchi to''liq mock test.',
   'full_mock', null, 'B2–C1', 180, true, true, 4)
on conflict (id) do update set
  title = excluded.title, description = excluded.description,
  is_premium = excluded.is_premium, order_index = excluded.order_index;

-- ---- FULL MOCK 1 — bo'limlar ------------------------------------------------
insert into public.test_parts
  (id, test_set_id, section, title, instructions, passage, audio_url, transcript, duration_minutes, order_index)
values
  ('b0000000-0000-4000-8000-000000000011',
   'a0000000-0000-4000-8000-000000000001', 'listening',
   'Listening — Part 1',
   'Audioni diqqat bilan tinglang. Audio faqat bir marta ijro etiladi. Savollarga javob bering.',
   null, null,
   $t$Woman: Good morning, City Library. How can I help you?
Man: Hi, I'd like to know about membership.
Woman: Of course. A standard card costs twelve pounds a year and lets you borrow six items at a time.
Man: And is there a student discount?
Woman: Yes — students pay only seven pounds, but you need to bring your student ID.
Man: Great. What are the opening hours?
Woman: We open at nine in the morning and close at eight, Monday to Friday. On Saturday we close at five, and we are closed on Sunday.$t$,
   30, 1),

  ('b0000000-0000-4000-8000-000000000012',
   'a0000000-0000-4000-8000-000000000001', 'reading',
   'Reading — Part 1',
   'Matnni o''qing va savollarga javob bering. Sizga 60 daqiqa beriladi.',
   $t$<h2>The Quiet Rise of Urban Farming</h2>
<p>Walk through almost any large city today and, somewhere above the traffic, you are likely to find tomatoes ripening on a rooftop. Urban farming — growing food inside cities rather than transporting it in from the countryside — has moved from a hobby for enthusiasts to a serious part of how modern cities feed themselves.</p>
<p>The idea is not new. During both World Wars, governments encouraged citizens to plant "victory gardens" in parks and back yards. What is new is the technology. Vertical farms stack growing trays from floor to ceiling under LED lights tuned to the exact wavelengths plants use. Because the environment is fully controlled, crops are unaffected by weather, and water is recycled rather than lost to the soil. A well-designed vertical farm can use as little as five per cent of the water needed by a traditional field.</p>
<p>The benefits go beyond water. Food grown in the city travels metres rather than hundreds of kilometres, which cuts transport emissions and means produce reaches the shelf within hours of being picked. Supporters also point to the social value: rooftop gardens in Singapore and community plots in Detroit have given neighbourhoods a shared project and, in some cases, a source of income.</p>
<p>Critics, however, urge caution. Vertical farms consume large amounts of electricity, and unless that power comes from renewable sources, the environmental gains are smaller than they appear. The economics remain difficult too: leafy greens and herbs are profitable, but staple crops such as wheat and rice cannot yet be grown indoors at a competitive price. For this reason most researchers describe urban farming as a valuable supplement to conventional agriculture rather than a replacement for it.</p>
<p>What seems certain is that cities will keep experimenting. As populations grow and farmland becomes scarcer, the question is no longer whether food will be grown in cities, but how much of it.</p>$t$,
   null, null, 60, 2),

  ('b0000000-0000-4000-8000-000000000013',
   'a0000000-0000-4000-8000-000000000001', 'writing',
   'Writing — Task 1 & Task 2',
   'Ikkala topshiriqni ham bajaring. Task 1 uchun ~20 daqiqa, Task 2 uchun ~40 daqiqa sarflang.',
   null, null, null, 60, 3),

  ('b0000000-0000-4000-8000-000000000014',
   'a0000000-0000-4000-8000-000000000001', 'speaking',
   'Speaking — Part 1, 2 & 3',
   'Har bir savolga ovozli javob bering yoki javobingizni yozib qoldiring. Tayyorgarlik uchun 1 daqiqa vaqt bor.',
   null, null, null, 15, 4)
on conflict (id) do update set
  title = excluded.title, instructions = excluded.instructions,
  passage = excluded.passage, transcript = excluded.transcript;

-- ---- FULL MOCK 1 — Listening savollari -------------------------------------
insert into public.questions (id, part_id, kind, prompt, options, correct_answer, points, explanation, order_index)
values
  ('c0000000-0000-4000-8000-000000000101', 'b0000000-0000-4000-8000-000000000011',
   'mcq', 'How much does a standard library card cost per year?',
   '["7 pounds","10 pounds","12 pounds","20 pounds"]'::jsonb, '"12 pounds"'::jsonb, 1,
   'Ayol aniq aytadi: "A standard card costs twelve pounds a year."', 1),

  ('c0000000-0000-4000-8000-000000000102', 'b0000000-0000-4000-8000-000000000011',
   'mcq', 'How many items can a standard member borrow at one time?',
   '["Four","Five","Six","Eight"]'::jsonb, '"Six"'::jsonb, 1,
   '"...lets you borrow six items at a time."', 2),

  ('c0000000-0000-4000-8000-000000000103', 'b0000000-0000-4000-8000-000000000011',
   'gap_fill', 'Students pay only ______ pounds for a card.',
   '[]'::jsonb, '["seven","7"]'::jsonb, 1,
   'Talabalar uchun 7 funt.', 3),

  ('c0000000-0000-4000-8000-000000000104', 'b0000000-0000-4000-8000-000000000011',
   'true_false_ng', 'The library is open on Sunday.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"FALSE"'::jsonb, 1,
   '"...we are closed on Sunday."', 4),

  ('c0000000-0000-4000-8000-000000000105', 'b0000000-0000-4000-8000-000000000011',
   'gap_fill', 'On Saturday the library closes at ______ o''clock.',
   '[]'::jsonb, '["five","5"]'::jsonb, 1,
   '"On Saturday we close at five."', 5),

  ('c0000000-0000-4000-8000-000000000106', 'b0000000-0000-4000-8000-000000000011',
   'mcq', 'What must students bring to get the discount?',
   '["A passport","A student ID","A bank card","A photograph"]'::jsonb, '"A student ID"'::jsonb, 1,
   '"...you need to bring your student ID."', 6)
on conflict (id) do update set prompt = excluded.prompt, options = excluded.options,
  correct_answer = excluded.correct_answer, explanation = excluded.explanation;

-- ---- FULL MOCK 1 — Reading savollari ---------------------------------------
insert into public.questions (id, part_id, kind, prompt, options, correct_answer, points, explanation, order_index)
values
  ('c0000000-0000-4000-8000-000000000201', 'b0000000-0000-4000-8000-000000000012',
   'true_false_ng', 'Urban farming was invented in the twenty-first century.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"FALSE"'::jsonb, 1,
   'Matnda: "The idea is not new" — urushlar davrida ham bo''lgan.', 1),

  ('c0000000-0000-4000-8000-000000000202', 'b0000000-0000-4000-8000-000000000012',
   'true_false_ng', 'Vertical farms can operate regardless of the weather outside.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"TRUE"'::jsonb, 1,
   '"Because the environment is fully controlled, crops are unaffected by weather."', 2),

  ('c0000000-0000-4000-8000-000000000203', 'b0000000-0000-4000-8000-000000000012',
   'true_false_ng', 'Most vertical farms in Europe are owned by large supermarket chains.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"NOT GIVEN"'::jsonb, 1,
   'Matnda supermarketlar egaligi haqida hech narsa aytilmagan.', 3),

  ('c0000000-0000-4000-8000-000000000204', 'b0000000-0000-4000-8000-000000000012',
   'mcq', 'According to the passage, a well-designed vertical farm may use only:',
   '["5% of the water used by a traditional field","25% of the water used by a traditional field","half of the water used by a traditional field","the same water as a traditional field"]'::jsonb,
   '"5% of the water used by a traditional field"'::jsonb, 1,
   '"...as little as five per cent of the water needed by a traditional field."', 4),

  ('c0000000-0000-4000-8000-000000000205', 'b0000000-0000-4000-8000-000000000012',
   'mcq', 'What is the main concern raised by critics?',
   '["Food quality is lower","Electricity consumption is high","City people dislike farming","Crops grow too slowly"]'::jsonb,
   '"Electricity consumption is high"'::jsonb, 1,
   '"Vertical farms consume large amounts of electricity..."', 5),

  ('c0000000-0000-4000-8000-000000000206', 'b0000000-0000-4000-8000-000000000012',
   'gap_fill', 'Crops that are currently profitable indoors include leafy greens and ______.',
   '[]'::jsonb, '["herbs"]'::jsonb, 1,
   '"leafy greens and herbs are profitable"', 6),

  ('c0000000-0000-4000-8000-000000000207', 'b0000000-0000-4000-8000-000000000012',
   'mcq', 'How do most researchers describe urban farming?',
   '["As a complete replacement for farms","As a useful supplement to conventional agriculture","As an unprofitable hobby","As a temporary trend"]'::jsonb,
   '"As a useful supplement to conventional agriculture"'::jsonb, 1,
   'Oxirgi xatboshidan oldingi jumla.', 7),

  ('c0000000-0000-4000-8000-000000000208', 'b0000000-0000-4000-8000-000000000012',
   'matching', 'Quyidagi shaharlarni matnda tilga olingan misolga moslashtiring.',
   $opts$[
     {"left": "1", "label": "Singapore", "right": ["Rooftop gardens", "Community plots", "Victory gardens"]},
     {"left": "2", "label": "Detroit",   "right": ["Rooftop gardens", "Community plots", "Victory gardens"]}
   ]$opts$::jsonb,
   '{"1": "Rooftop gardens", "2": "Community plots"}'::jsonb, 2,
   '"rooftop gardens in Singapore and community plots in Detroit"', 8)
on conflict (id) do update set prompt = excluded.prompt, options = excluded.options,
  correct_answer = excluded.correct_answer, explanation = excluded.explanation;

-- ---- FULL MOCK 1 — Writing topshiriqlari -----------------------------------
insert into public.questions (id, part_id, kind, prompt, help_text, options, correct_answer, points, order_index)
values
  ('c0000000-0000-4000-8000-000000000301', 'b0000000-0000-4000-8000-000000000013',
   'essay',
   'Task 1. Your friend is planning to move to your city. Write an email of about 100 words. In your email: say what you like most about the city, warn your friend about one problem, and offer practical help with finding accommodation.',
   'Kamida 100 so''z. Xat uslubida yozing.',
   '[]'::jsonb, null, 30, 1),

  ('c0000000-0000-4000-8000-000000000302', 'b0000000-0000-4000-8000-000000000013',
   'essay',
   'Task 2. Some people believe that students should be required to study a foreign language at school, while others think it should be optional. Discuss both views and give your own opinion. Write at least 200 words.',
   'Kamida 200 so''z. Kirish – 2 ta asosiy xatboshi – xulosa.',
   '[]'::jsonb, null, 70, 2)
on conflict (id) do update set prompt = excluded.prompt, help_text = excluded.help_text;

-- ---- FULL MOCK 1 — Speaking topshiriqlari ----------------------------------
insert into public.questions (id, part_id, kind, prompt, help_text, options, correct_answer, points, order_index)
values
  ('c0000000-0000-4000-8000-000000000401', 'b0000000-0000-4000-8000-000000000014',
   'speaking_prompt',
   'Part 1. Let''s talk about your free time. What do you usually do at the weekend? Do you prefer spending time indoors or outdoors? Why?',
   'Tayyorgarlik: 10 soniya · Javob: 1 daqiqa', '[]'::jsonb, null, 25, 1),

  ('c0000000-0000-4000-8000-000000000402', 'b0000000-0000-4000-8000-000000000014',
   'speaking_prompt',
   'Part 2. Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, how you would learn it, and explain how it would change your life.',
   'Tayyorgarlik: 1 daqiqa · Javob: 2 daqiqa', '[]'::jsonb, null, 40, 2),

  ('c0000000-0000-4000-8000-000000000403', 'b0000000-0000-4000-8000-000000000014',
   'speaking_prompt',
   'Part 3. Do you think schools should teach more practical skills instead of academic subjects? Why do some skills become less useful over time?',
   'Javob: 2 daqiqa · Fikringizni asoslang', '[]'::jsonb, null, 35, 3)
on conflict (id) do update set prompt = excluded.prompt, help_text = excluded.help_text;

-- ---- FULL MOCK 2 — qisqartirilgan namuna -----------------------------------
insert into public.test_parts
  (id, test_set_id, section, title, instructions, passage, duration_minutes, order_index)
values
  ('b0000000-0000-4000-8000-000000000021',
   'a0000000-0000-4000-8000-000000000002', 'reading',
   'Reading — Part 1', 'Matnni o''qib, savollarga javob bering.',
   $t$<h2>Why We Forget</h2>
<p>Forgetting feels like a failure of the mind, but psychologists increasingly argue that it is one of memory's most useful features. A brain that stored every detail of every day would struggle to find the information that actually matters.</p>
<p>The German psychologist Hermann Ebbinghaus was the first to measure forgetting scientifically. In the 1880s he memorised lists of nonsense syllables and tested himself at intervals. His results produced the famous "forgetting curve": memory falls away steeply in the first hours after learning, then levels off. Roughly half of newly learned material can disappear within a day.</p>
<p>Yet the curve can be flattened. Reviewing material shortly before it would be forgotten — a technique called spaced repetition — dramatically improves retention. Each review resets the curve and makes the next drop slower. Testing yourself, rather than simply rereading, strengthens the effect further, a phenomenon researchers call the testing effect.</p>
<p>This has practical consequences for language learners. Studying a word list for three hours on a single evening produces far weaker results than studying it for twenty minutes on nine separate days, even though the total time is similar.</p>$t$,
   60, 1)
on conflict (id) do update set passage = excluded.passage;

insert into public.questions (id, part_id, kind, prompt, options, correct_answer, points, explanation, order_index)
values
  ('c0000000-0000-4000-8000-000000000501', 'b0000000-0000-4000-8000-000000000021',
   'mcq', 'Who first measured forgetting scientifically?',
   '["Hermann Ebbinghaus","Sigmund Freud","William James","Ivan Pavlov"]'::jsonb,
   '"Hermann Ebbinghaus"'::jsonb, 1, 'Ikkinchi xatboshi.', 1),
  ('c0000000-0000-4000-8000-000000000502', 'b0000000-0000-4000-8000-000000000021',
   'true_false_ng', 'According to the passage, forgetting is entirely harmful.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"FALSE"'::jsonb, 1,
   'Birinchi xatboshi: forgetting "one of memory''s most useful features".', 2),
  ('c0000000-0000-4000-8000-000000000503', 'b0000000-0000-4000-8000-000000000021',
   'gap_fill', 'Reviewing material at increasing intervals is called ______ repetition.',
   '[]'::jsonb, '["spaced"]'::jsonb, 1, 'Uchinchi xatboshi.', 3),
  ('c0000000-0000-4000-8000-000000000504', 'b0000000-0000-4000-8000-000000000021',
   'mcq', 'What does the "testing effect" refer to?',
   '["Exams causing stress","Self-testing strengthening memory","Tests being unfair","Testing new medicines"]'::jsonb,
   '"Self-testing strengthening memory"'::jsonb, 1, 'Uchinchi xatboshi oxiri.', 4),
  ('c0000000-0000-4000-8000-000000000505', 'b0000000-0000-4000-8000-000000000021',
   'true_false_ng', 'Studying twenty minutes a day for nine days beats one three-hour session.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"TRUE"'::jsonb, 1, 'Oxirgi xatboshi.', 5)
on conflict (id) do update set prompt = excluded.prompt, correct_answer = excluded.correct_answer;

-- ============================================================================
-- 2) OXIRGI TUSHGAN SAVOLLAR  (hujjat: 4-bo'lim)
-- ============================================================================
insert into public.test_sets
  (id, slug, title, description, category, section, year_label, duration_minutes, is_premium, published, order_index)
values
  ('a0000000-0000-4000-8000-000000000101', 'lq-2526-reading',   'Reading — 2025–2026 savollari',   'O''tgan imtihonlarda tushgan Reading savollari.',   'latest_questions', 'reading',   '2025–2026', 60, false, true, 1),
  ('a0000000-0000-4000-8000-000000000102', 'lq-2526-listening', 'Listening — 2025–2026 savollari', 'O''tgan imtihonlarda tushgan Listening savollari.', 'latest_questions', 'listening', '2025–2026', 35, false, true, 2),
  ('a0000000-0000-4000-8000-000000000103', 'lq-2526-writing',   'Writing — 2025–2026 savollari',   'Real imtihonlarda tushgan Writing topshiriqlari.', 'latest_questions', 'writing',   '2025–2026', 60, true,  true, 3),
  ('a0000000-0000-4000-8000-000000000104', 'lq-2526-speaking',  'Speaking — 2025–2026 topiklari',  'Real imtihonlarda tushgan Speaking topiklari.',    'latest_questions', 'speaking',  '2025–2026', 15, true,  true, 4),

  ('a0000000-0000-4000-8000-000000000111', 'lq-2425-reading',   'Reading — 2024–2025 savollari',   'Arxiv Reading savollari.',   'latest_questions', 'reading',   '2024–2025', 60, false, true, 1),
  ('a0000000-0000-4000-8000-000000000112', 'lq-2425-listening', 'Listening — 2024–2025 savollari', 'Arxiv Listening savollari.', 'latest_questions', 'listening', '2024–2025', 35, true,  true, 2),
  ('a0000000-0000-4000-8000-000000000113', 'lq-2425-writing',   'Writing — 2024–2025 savollari',   'Arxiv Writing topshiriqlari.','latest_questions', 'writing',  '2024–2025', 60, true,  true, 3),
  ('a0000000-0000-4000-8000-000000000114', 'lq-2425-speaking',  'Speaking — 2024–2025 topiklari',  'Arxiv Speaking topiklari.',  'latest_questions', 'speaking',  '2024–2025', 15, true,  true, 4),

  ('a0000000-0000-4000-8000-000000000121', 'lq-2324-reading',   'Reading — 2023–2024 savollari',   'Arxiv Reading savollari.',   'latest_questions', 'reading',   '2023–2024', 60, false, true, 1),
  ('a0000000-0000-4000-8000-000000000122', 'lq-2324-listening', 'Listening — 2023–2024 savollari', 'Arxiv Listening savollari.', 'latest_questions', 'listening', '2023–2024', 35, true,  true, 2),
  ('a0000000-0000-4000-8000-000000000123', 'lq-2324-writing',   'Writing — 2023–2024 savollari',   'Arxiv Writing topshiriqlari.','latest_questions', 'writing',  '2023–2024', 60, true,  true, 3),
  ('a0000000-0000-4000-8000-000000000124', 'lq-2324-speaking',  'Speaking — 2023–2024 topiklari',  'Arxiv Speaking topiklari.',  'latest_questions', 'speaking',  '2023–2024', 15, true,  true, 4)
on conflict (id) do update set title = excluded.title, is_premium = excluded.is_premium;

-- 2025–2026 Reading — ishlaydigan namuna
insert into public.test_parts
  (id, test_set_id, section, title, instructions, passage, duration_minutes, order_index)
values
  ('b0000000-0000-4000-8000-000000000101',
   'a0000000-0000-4000-8000-000000000101', 'reading',
   'Reading — 2025 yil, mart sessiyasi',
   'Ushbu savollar imtihon topshirgan o''quvchilar tomonidan eslab qolingan.',
   $t$<h2>The Return of the Night Train</h2>
<p>For two decades the night train looked like a relic. Budget airlines undercut fares, sleeper carriages were expensive to maintain, and one European operator after another quietly closed its overnight routes. Then, almost without warning, the sleeper came back.</p>
<p>The reason is partly environmental. A passenger travelling from Vienna to Brussels by night train produces roughly a tenth of the carbon dioxide they would generate flying the same distance. As climate concern moved from the margins into mainstream politics, several governments began subsidising routes they had recently abandoned.</p>
<p>Comfort has also improved. Modern sleeper carriages offer private cabins with showers, and passengers increasingly value arriving in a city centre at breakfast time rather than at an airport thirty kilometres away at midnight. For journeys of between six and twelve hours, the night train can be faster door to door than flying once check-in and transfers are counted.</p>
<p>Obstacles remain. Cross-border ticketing is complicated, track access charges differ from country to country, and a single delayed train can disrupt an entire network. Even so, bookings on European night services have risen every year since 2020, and new routes are announced regularly.</p>$t$,
   60, 1)
on conflict (id) do update set passage = excluded.passage;

insert into public.questions (id, part_id, kind, prompt, options, correct_answer, points, explanation, order_index)
values
  ('c0000000-0000-4000-8000-000000000601', 'b0000000-0000-4000-8000-000000000101',
   'true_false_ng', 'Night trains disappeared completely from Europe before 2020.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"FALSE"'::jsonb, 1,
   'Matnda "one operator after another quietly closed its overnight routes" deyilgan, lekin butunlay yo''qolgani aytilmagan — aksincha, qaytib keldi.', 1),
  ('c0000000-0000-4000-8000-000000000602', 'b0000000-0000-4000-8000-000000000101',
   'mcq', 'Compared with flying, a night train from Vienna to Brussels produces about:',
   '["the same CO2","half the CO2","a tenth of the CO2","twice the CO2"]'::jsonb,
   '"a tenth of the CO2"'::jsonb, 1, 'Ikkinchi xatboshi.', 2),
  ('c0000000-0000-4000-8000-000000000603', 'b0000000-0000-4000-8000-000000000101',
   'gap_fill', 'For journeys between six and ______ hours, night trains can beat flying door to door.',
   '[]'::jsonb, '["twelve","12"]'::jsonb, 1, 'Uchinchi xatboshi.', 3),
  ('c0000000-0000-4000-8000-000000000604', 'b0000000-0000-4000-8000-000000000101',
   'multi_select', 'Which TWO problems does the passage mention? (2 ta javobni tanlang)',
   '["Complicated cross-border ticketing","Lack of passenger interest","Differing track access charges","Shortage of drivers"]'::jsonb,
   '["Complicated cross-border ticketing","Differing track access charges"]'::jsonb, 2,
   'Oxirgi xatboshi.', 4)
on conflict (id) do update set prompt = excluded.prompt, correct_answer = excluded.correct_answer;

-- ============================================================================
-- 3) EXAM FULL CHECKING  (hujjat: 10–12-bo'limlar) — faqat Premium
-- ============================================================================
insert into public.test_sets
  (id, slug, title, description, category, section, level, duration_minutes, is_premium, published, order_index)
values
  ('a0000000-0000-4000-8000-000000000201', 'exam-checking-1',
   'Multilevel Exam Simulation #1',
   'Real kompyuter imtihonidek: Listening → Reading → Writing → Speaking. Yakunda to''liq natija va CEFR darajasi.',
   'exam_checking', null, 'B1–C1', 195, true, true, 1),
  ('a0000000-0000-4000-8000-000000000202', 'exam-checking-2',
   'Multilevel Exam Simulation #2',
   'Ikkinchi to''liq imtihon simulyatsiyasi.',
   'exam_checking', null, 'B1–C1', 195, true, true, 2)
on conflict (id) do update set title = excluded.title, description = excluded.description;

insert into public.test_parts
  (id, test_set_id, section, title, instructions, passage, transcript, duration_minutes, order_index)
values
  ('b0000000-0000-4000-8000-000000000201',
   'a0000000-0000-4000-8000-000000000201', 'listening',
   'Listening', 'Audio bir marta ijro etiladi. Bo''lim tugagach, orqaga qaytib bo''lmaydi.',
   null,
   $t$Presenter: Welcome back. Today we're discussing how cities are adapting to hotter summers.
Dr Aliyeva: Thank you. The single most effective measure is shade. Trees can lower street-level temperature by up to eight degrees.
Presenter: Eight degrees? That's more than air conditioning would achieve outdoors.
Dr Aliyeva: Exactly, and it costs a fraction of the price. The second measure is reflective roofing — painting roofs white can cut indoor temperature by four to five degrees.
Presenter: And what about water features?
Dr Aliyeva: They help locally, but they use a great deal of water, so in dry regions we don't recommend them as a first step.$t$,
   35, 1),

  ('b0000000-0000-4000-8000-000000000202',
   'a0000000-0000-4000-8000-000000000201', 'reading',
   'Reading', 'Sizga 60 daqiqa beriladi. Vaqt tugagach javoblar avtomatik saqlanadi.',
   $t$<h2>The Economics of Attention</h2>
<p>Every time a new technology makes information cheaper to produce, something else becomes scarce. When printing presses spread across Europe, books multiplied but readers' time did not. The economist Herbert Simon put the principle plainly in 1971: a wealth of information creates a poverty of attention.</p>
<p>Today that poverty is acute. The average smartphone user unlocks their device more than seventy times a day, and studies of office workers suggest that once interrupted, it takes over twenty minutes to return to the original task at full concentration. The cost is not simply lost minutes; it is the loss of the deep, uninterrupted thinking on which difficult work depends.</p>
<p>Some companies have responded with structural changes rather than advice. A few have abolished internal email entirely, others protect two hours each morning during which no meetings may be scheduled. Early evidence suggests these policies work better than asking individuals to show more willpower, because they change the environment rather than the person.</p>
<p>Critics note that attention has always been contested, and that every generation believes its own distractions are uniquely severe. The difference now, defenders of the argument reply, is scale: for the first time, some of the world's largest companies earn their revenue directly from how long they can hold a person's gaze.</p>$t$,
   null, 60, 2),

  ('b0000000-0000-4000-8000-000000000203',
   'a0000000-0000-4000-8000-000000000201', 'writing',
   'Writing', 'Task 1: ~20 daqiqa. Task 2: ~40 daqiqa. Javoblaringiz o''qituvchi tomonidan tekshiriladi.',
   null, null, 60, 3),

  ('b0000000-0000-4000-8000-000000000204',
   'a0000000-0000-4000-8000-000000000201', 'speaking',
   'Speaking', 'Har bir qismda tayyorgarlik vaqti beriladi. Javobingizni yozib oling yoki matn ko''rinishida kiriting.',
   null, null, 15, 4)
on conflict (id) do update set passage = excluded.passage, transcript = excluded.transcript;

insert into public.questions (id, part_id, kind, prompt, options, correct_answer, points, explanation, order_index)
values
  -- Listening
  ('c0000000-0000-4000-8000-000000000701', 'b0000000-0000-4000-8000-000000000201',
   'mcq', 'Trees can lower street-level temperature by up to:',
   '["Four degrees","Five degrees","Eight degrees","Twelve degrees"]'::jsonb,
   '"Eight degrees"'::jsonb, 1, 'Dr Aliyeva aniq aytadi.', 1),
  ('c0000000-0000-4000-8000-000000000702', 'b0000000-0000-4000-8000-000000000201',
   'gap_fill', 'Painting roofs ______ can cut indoor temperature by four to five degrees.',
   '[]'::jsonb, '["white"]'::jsonb, 1, '"painting roofs white"', 2),
  ('c0000000-0000-4000-8000-000000000703', 'b0000000-0000-4000-8000-000000000201',
   'true_false_ng', 'Water features are recommended as the first measure in dry regions.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"FALSE"'::jsonb, 1,
   '"in dry regions we don''t recommend them as a first step"', 3),
  -- Reading
  ('c0000000-0000-4000-8000-000000000711', 'b0000000-0000-4000-8000-000000000202',
   'mcq', 'Who said that a wealth of information creates a poverty of attention?',
   '["Herbert Simon","Adam Smith","John Keynes","Daniel Kahneman"]'::jsonb,
   '"Herbert Simon"'::jsonb, 1, 'Birinchi xatboshi.', 1),
  ('c0000000-0000-4000-8000-000000000712', 'b0000000-0000-4000-8000-000000000202',
   'gap_fill', 'After an interruption it takes over ______ minutes to regain full concentration.',
   '[]'::jsonb, '["twenty","20"]'::jsonb, 1, 'Ikkinchi xatboshi.', 2),
  ('c0000000-0000-4000-8000-000000000713', 'b0000000-0000-4000-8000-000000000202',
   'true_false_ng', 'The passage says structural policies work better than relying on willpower.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"TRUE"'::jsonb, 1, 'Uchinchi xatboshi.', 3),
  ('c0000000-0000-4000-8000-000000000714', 'b0000000-0000-4000-8000-000000000202',
   'true_false_ng', 'All large technology companies have abolished internal email.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"FALSE"'::jsonb, 1,
   'Matnda "a few have abolished" deyilgan — hammasi emas.', 4),
  -- Writing
  ('c0000000-0000-4000-8000-000000000721', 'b0000000-0000-4000-8000-000000000203',
   'essay',
   'Task 1. You recently attended an online course that did not meet your expectations. Write a letter to the course provider. Explain what you expected, describe what went wrong, and say what you would like them to do. Write about 100 words.',
   '[]'::jsonb, null, 30, null, 1),
  ('c0000000-0000-4000-8000-000000000722', 'b0000000-0000-4000-8000-000000000203',
   'essay',
   'Task 2. In many countries, people are working longer hours than in the past. What are the causes of this trend, and what effects does it have on family life? Write at least 200 words.',
   '[]'::jsonb, null, 70, null, 2),
  -- Speaking
  ('c0000000-0000-4000-8000-000000000731', 'b0000000-0000-4000-8000-000000000204',
   'speaking_prompt',
   'Part 1. Tell me about the place where you grew up. What did you like about it? Has it changed much?',
   '[]'::jsonb, null, 25, null, 1),
  ('c0000000-0000-4000-8000-000000000732', 'b0000000-0000-4000-8000-000000000204',
   'speaking_prompt',
   'Part 2. Describe a decision you made that turned out well. You should say: what the decision was, when you made it, why you made it, and explain why you think it was a good decision.',
   '[]'::jsonb, null, 40, null, 2),
  ('c0000000-0000-4000-8000-000000000733', 'b0000000-0000-4000-8000-000000000204',
   'speaking_prompt',
   'Part 3. Do young people today find it harder to make long-term decisions than previous generations? Why?',
   '[]'::jsonb, null, 35, null, 3)
on conflict (id) do update set prompt = excluded.prompt, correct_answer = excluded.correct_answer;

-- ============================================================================
-- 4) BOOST YOUR GENERAL ENGLISH — LISTENING PRACTICE  (hujjat: 5B-bo'lim)
-- ============================================================================
insert into public.test_sets
  (id, slug, title, description, category, section, level, duration_minutes, is_premium, published, order_index)
values
  ('a0000000-0000-4000-8000-000000000301', 'lp-daily-conversations',
   'Listening Practice 1 — Daily Conversations',
   'Kundalik suhbatlar: do''kon, kafe, universitet. Gap filling va multiple choice.',
   'general_english', 'listening', 'A2–B1', 20, false, true, 1),
  ('a0000000-0000-4000-8000-000000000302', 'lp-academic-lecture',
   'Listening Practice 2 — Academic Lecture',
   'Qisqa akademik ma''ruza. Matching va comprehension savollari.',
   'general_english', 'listening', 'B1–B2', 25, false, true, 2),
  ('a0000000-0000-4000-8000-000000000303', 'lp-news-report',
   'Listening Practice 3 — News Reports',
   'Yangiliklar uslubidagi matnlar. Tezroq nutq, murakkabroq lug''at.',
   'general_english', 'listening', 'B2–C1', 25, true, true, 3)
on conflict (id) do update set title = excluded.title, is_premium = excluded.is_premium;

insert into public.test_parts
  (id, test_set_id, section, title, instructions, transcript, duration_minutes, order_index)
values
  ('b0000000-0000-4000-8000-000000000301',
   'a0000000-0000-4000-8000-000000000301', 'listening',
   'At the University Office', 'Suhbatni tinglang va bo''sh joylarni to''ldiring.',
   $t$Student: Excuse me, I need to register for the autumn semester.
Officer: Certainly. Do you have your student number?
Student: Yes, it's B-four-seven-two-nine.
Officer: Thank you. Registration closes on the fifteenth of September, so you still have a week.
Student: Is there a fee?
Officer: The registration fee is thirty thousand, payable online or at the cashier on the ground floor.
Student: And when do classes start?
Officer: The twenty-second of September, at nine in the morning.$t$,
   20, 1)
on conflict (id) do update set transcript = excluded.transcript;

insert into public.questions (id, part_id, kind, prompt, options, correct_answer, points, explanation, order_index)
values
  ('c0000000-0000-4000-8000-000000000801', 'b0000000-0000-4000-8000-000000000301',
   'gap_fill', 'The student number is B-______.',
   '[]'::jsonb, '["4729","four seven two nine"]'::jsonb, 1, 'Talaba raqamni aytadi.', 1),
  ('c0000000-0000-4000-8000-000000000802', 'b0000000-0000-4000-8000-000000000301',
   'mcq', 'When does registration close?',
   '["8 September","15 September","22 September","30 September"]'::jsonb,
   '"15 September"'::jsonb, 1, '"Registration closes on the fifteenth of September"', 2),
  ('c0000000-0000-4000-8000-000000000803', 'b0000000-0000-4000-8000-000000000301',
   'gap_fill', 'The registration fee is ______ thousand.',
   '[]'::jsonb, '["thirty","30"]'::jsonb, 1, 'Xodim aytadi.', 3),
  ('c0000000-0000-4000-8000-000000000804', 'b0000000-0000-4000-8000-000000000301',
   'mcq', 'Where can the fee be paid in person?',
   '["At the library","At the cashier on the ground floor","At the main gate","Only online"]'::jsonb,
   '"At the cashier on the ground floor"'::jsonb, 1, 'Suhbatda aniq aytilgan.', 4)
on conflict (id) do update set prompt = excluded.prompt, correct_answer = excluded.correct_answer;

-- ============================================================================
-- 5) ARTICLES — Boost Your General English  (hujjat: 5A-bo'lim)
-- ============================================================================
insert into public.articles
  (id, slug, title, topic, excerpt, body, level, read_minutes, vocabulary, is_premium, published, order_index)
values
  ('d0000000-0000-4000-8000-000000000001', 'how-sleep-rebuilds-the-brain',
   'How Sleep Rebuilds the Brain', 'science',
   'Uyqu shunchaki dam olish emas — miya har kecha o''zini tozalaydi va qayta quradi.',
   $t$<p>For most of the twentieth century, sleep was treated as a kind of switching off — a period when the brain simply stopped. Modern neuroscience tells a very different story. The sleeping brain is intensely active, and much of what it does cannot be done while we are awake.</p>
<h2>Cleaning the machinery</h2>
<p>In 2013 researchers discovered that during deep sleep the spaces between brain cells expand by as much as sixty per cent, allowing fluid to flow through the tissue and wash away waste proteins. One of these proteins, beta-amyloid, accumulates in the brains of people with Alzheimer's disease. A single night of poor sleep measurably raises the level of beta-amyloid in healthy volunteers.</p>
<h2>Sorting the day</h2>
<p>Sleep also decides what we remember. During the night the hippocampus replays the day's experiences to the cortex, gradually transferring the ones judged important into long-term storage. This is why students who sleep after studying outperform those who stay awake for the same number of hours, even when total study time is identical.</p>
<h2>The cost of losing it</h2>
<p>The effects of restricting sleep are quietly severe. After ten days of six hours a night, reaction times fall to roughly the level produced by twenty-four hours of total sleep deprivation — yet the volunteers in these studies consistently rate their own performance as normal. We are poor judges of our own tiredness.</p>
<p>The practical advice has not changed much: a consistent schedule, a dark and cool room, and no screens in the final hour. What has changed is how seriously scientists take it.</p>$t$,
   'B2', 6,
   $v$[
     {"word":"accumulate","meaning":"to'planmoq, yig'ilmoq","example":"Waste proteins accumulate during the day."},
     {"word":"deprivation","meaning":"mahrumlik, yetishmovchilik","example":"Sleep deprivation slows reaction times."},
     {"word":"severe","meaning":"jiddiy, og'ir","example":"The effects are quietly severe."},
     {"word":"consistent","meaning":"izchil, barqaror","example":"Keep a consistent sleep schedule."},
     {"word":"outperform","meaning":"ustun kelmoq","example":"Students who sleep outperform those who don't."}
   ]$v$::jsonb,
   false, true, 1),

  ('d0000000-0000-4000-8000-000000000002', 'the-language-of-algorithms',
   'The Language of Algorithms', 'technology',
   'Algoritmlar bizning tanlovimizni qanday shakllantiradi va nima uchun buni sezmaymiz.',
   $t$<p>An algorithm is nothing more than a set of instructions for solving a problem. A recipe is an algorithm; so is the method you were taught for long division. What has changed is not the idea but the scale on which it is applied.</p>
<h2>From sorting to deciding</h2>
<p>Early computer algorithms sorted numbers and searched lists. Today they rank news, recommend films, filter job applications and estimate how likely a borrower is to repay a loan. The shift from sorting to deciding is what makes them politically interesting.</p>
<h2>The problem of proxies</h2>
<p>An algorithm cannot measure what it cannot see. Asked to predict whether an applicant will succeed in a job, it uses whatever data exists — previous hires, education, postcode — and treats these as proxies for ability. If past hiring was biased, the proxy inherits the bias and reproduces it at speed. The machine is not prejudiced; it is obedient.</p>
<h2>Explaining the answer</h2>
<p>A further difficulty is opacity. Modern systems may weigh thousands of variables, and no single one explains the result. Regulators in several countries now require that automated decisions affecting individuals can be explained in plain language, which has created an entire research field devoted to making models interpretable.</p>
<p>None of this argues against using algorithms. It argues for asking, each time one is deployed, a simple question: what exactly is being optimised, and who decided that it should be?</p>$t$,
   'B2', 7,
   $v$[
     {"word":"proxy","meaning":"o'rinbosar ko'rsatkich","example":"Postcode is used as a proxy for income."},
     {"word":"bias","meaning":"noxolislik, tarafkashlik","example":"The model inherited the bias in past data."},
     {"word":"opacity","meaning":"noaniqlik, tushunarsizlik","example":"The opacity of the system worries regulators."},
     {"word":"deploy","meaning":"joriy etmoq, ishga solmoq","example":"Before an algorithm is deployed, ask what it optimises."},
     {"word":"obedient","meaning":"itoatkor","example":"The machine is not prejudiced; it is obedient."}
   ]$v$::jsonb,
   false, true, 2),

  ('d0000000-0000-4000-8000-000000000003', 'what-doctors-mean-by-stress',
   'What Doctors Actually Mean by Stress', 'health',
   'Stress har doim ham yomon emas — muhimi uning qancha davom etishi.',
   $t$<p>In everyday speech, "stress" describes an unpleasant feeling. In medicine it means something more precise: the body's response to a demand placed upon it. That response is not in itself harmful. It is what allows a student to concentrate in an exam and a driver to brake in time.</p>
<h2>Two systems, two speeds</h2>
<p>The fast system releases adrenaline within seconds: the heart beats harder, airways widen, glucose enters the blood. The slow system releases cortisol over minutes and hours, keeping energy available and temporarily suppressing functions the body considers non-urgent, including digestion and parts of the immune response.</p>
<h2>When it becomes a problem</h2>
<p>Difficulty arises when the slow system never switches off. Cortisol that remains elevated for weeks is associated with disturbed sleep, higher blood pressure and reduced resistance to infection. The damage comes from duration, not intensity — a frightening hour is far less harmful than six months of mild, unrelieved pressure.</p>
<h2>What helps</h2>
<p>Interventions that work tend to be unglamorous. Regular physical activity lowers resting cortisol. So does predictable sleep. Social contact matters more than most people expect: in several large studies, perceived loneliness predicted health outcomes as strongly as smoking. Control matters too — the same workload feels very different when a person can decide the order in which to do it.</p>$t$,
   'B1', 6,
   $v$[
     {"word":"suppress","meaning":"bostirmoq, susaytirmoq","example":"Cortisol temporarily suppresses digestion."},
     {"word":"elevated","meaning":"ko'tarilgan, yuqori","example":"Elevated cortisol disturbs sleep."},
     {"word":"duration","meaning":"davomiylik","example":"The damage comes from duration, not intensity."},
     {"word":"perceived","meaning":"his qilingan, sezilgan","example":"Perceived loneliness affects health."},
     {"word":"unglamorous","meaning":"oddiy, jozibasiz","example":"The best interventions are unglamorous."}
   ]$v$::jsonb,
   false, true, 3),

  ('d0000000-0000-4000-8000-000000000004', 'why-exams-changed',
   'Why Exams Changed — and What Came Next', 'education',
   'Imtihonlar nima uchun o''zgardi va bugungi baholash tizimi qanday ishlaydi.',
   $t$<p>The written examination is a surprisingly recent invention in the West. Until the nineteenth century, university students were mostly examined orally, in public, by a panel that could follow an argument wherever it led. Written papers spread because they were fairer to mark and, above all, because they scaled.</p>
<h2>The measurement problem</h2>
<p>Any examination is a sample. A three-hour paper cannot test everything a student knows, so it tests a slice and assumes the slice represents the whole. The quality of an exam therefore depends less on its difficulty than on how well its questions sample the thing it claims to measure — what specialists call validity.</p>
<h2>Four skills, four scores</h2>
<p>Language testing has moved furthest in this direction. Rather than one overall mark, modern language exams report separate scores for reading, listening, writing and speaking, because a learner may be strong in one and weak in another. Reporting a single average would hide exactly the information a teacher needs.</p>
<h2>Testing as learning</h2>
<p>The most surprising finding of recent decades is that examinations are themselves a powerful method of learning. Retrieving information strengthens memory more than reviewing it. This is why practice tests, taken seriously and reviewed afterwards, improve results more reliably than an equal amount of rereading.</p>$t$,
   'B2', 6,
   $v$[
     {"word":"validity","meaning":"ishonchlilik, haqqoniylik","example":"Validity means the test measures what it claims to."},
     {"word":"sample","meaning":"namuna olmoq","example":"An exam samples a slice of knowledge."},
     {"word":"retrieve","meaning":"eslab chiqarmoq","example":"Retrieving information strengthens memory."},
     {"word":"panel","meaning":"hay'at, komissiya","example":"A panel examined the students orally."},
     {"word":"scale","meaning":"kengaymoq, ko'paymoq","example":"Written papers spread because they scaled."}
   ]$v$::jsonb,
   false, true, 4),

  ('d0000000-0000-4000-8000-000000000005', 'the-habit-loop',
   'The Habit Loop', 'psychology',
   'Odatlar qanday shakllanadi va ularni o''zgartirishning eng ishonchli yo''li.',
   $t$<p>Roughly forty per cent of what a person does on an ordinary day is not decided in the moment. It is habit: behaviour triggered by context and executed with very little conscious thought.</p>
<h2>Cue, routine, reward</h2>
<p>Psychologists describe habits as a loop of three parts. A cue — a time, a place, a feeling, or the end of another action — triggers a routine, which produces a reward. Repeat this often enough and the brain begins to anticipate the reward as soon as the cue appears. That anticipation is what we experience as craving.</p>
<h2>Why willpower disappoints</h2>
<p>Attempts to break habits usually target the routine and rely on willpower to suppress it. This works while attention is available and fails when it is not, which is why habits return under stress. The more reliable strategy is to change the cue or the environment: people who want to stop checking their phone at night succeed far more often by leaving it in another room than by resolving not to look.</p>
<h2>Building rather than breaking</h2>
<p>New habits form fastest when they are attached to an existing cue — after brushing your teeth, after closing your laptop — and when the first version is small enough to be almost trivial. Reading one page a night sounds too modest to matter. It is also, unlike reading fifty, a thing that actually gets done.</p>$t$,
   'B1', 5,
   $v$[
     {"word":"cue","meaning":"ishora, turtki","example":"A cue triggers the routine."},
     {"word":"craving","meaning":"kuchli istak","example":"Anticipation is what we feel as craving."},
     {"word":"suppress","meaning":"bostirmoq","example":"Willpower suppresses the routine only briefly."},
     {"word":"trivial","meaning":"arzimas, juda kichik","example":"Make the first version almost trivial."},
     {"word":"anticipate","meaning":"oldindan kutmoq","example":"The brain anticipates the reward."}
   ]$v$::jsonb,
   true, true, 5),

  ('d0000000-0000-4000-8000-000000000006', 'the-city-that-moved-its-river',
   'The City That Moved Its River', 'history',
   'Bir shahar daryosini ko''chirib, o''z tarixini qanday o''zgartirgani haqida.',
   $t$<p>In 1900 the city of Chicago did something that still sounds impossible: it reversed the direction of a river. The Chicago River had always flowed into Lake Michigan, which was also the city's source of drinking water. As the population grew past a million, the consequences became lethal — waste flowed out and returned through the taps.</p>
<h2>An engineering answer</h2>
<p>Rather than build treatment plants, engineers cut a canal deep enough to pull the river the other way, sending it towards the Mississippi basin. Eight thousand workers spent eight years removing more earth than was later excavated for the Panama Canal. On the second of January 1900, the flow reversed.</p>
<h2>Consequences downstream</h2>
<p>The solution worked for Chicago. Typhoid deaths fell sharply within a decade. But the water had to go somewhere, and the state of Missouri sued almost immediately, arguing that the city had simply exported its problem. The case reached the Supreme Court, which allowed the diversion to continue under limits that are still argued about today.</p>
<h2>The lesson</h2>
<p>Historians of engineering often use Chicago as a case study in unintended consequences. The reversal is now also a corridor through which invasive species travel between two great water systems, a problem no one in 1900 could have described, let alone predicted.</p>$t$,
   'B2', 6,
   $v$[
     {"word":"lethal","meaning":"halokatli, o'ldiruvchi","example":"The consequences became lethal."},
     {"word":"excavate","meaning":"qazimoq","example":"More earth was excavated than for the Panama Canal."},
     {"word":"divert","meaning":"yo'naltirmoq, burmoq","example":"The diversion continues under limits."},
     {"word":"invasive","meaning":"bosqinchi (tur)","example":"Invasive species travel through the corridor."},
     {"word":"unintended","meaning":"ko'zda tutilmagan","example":"A case study in unintended consequences."}
   ]$v$::jsonb,
   true, true, 6),

  ('d0000000-0000-4000-8000-000000000007', 'living-with-less-water',
   'Living With Less Water', 'environment',
   'Suv tanqisligi sharoitida shaharlar qanday moslashmoqda.',
   $t$<p>Water scarcity is rarely a matter of there being no water. It is usually a matter of the water arriving at the wrong time, in the wrong place, or in a form too expensive to use. This distinction shapes almost every serious response to the problem.</p>
<h2>Demand before supply</h2>
<p>The cheapest new source of water in most cities is the water already being lost. Older distribution networks commonly leak twenty to thirty per cent of what enters them, and in some systems the figure passes forty. Repairing pipes is unglamorous and politically invisible, but it delivers more water per unit of spending than any reservoir.</p>
<h2>Reuse and recycling</h2>
<p>Singapore now meets a substantial share of its demand with highly treated recycled water, marketed under the name NEWater. The technology is not the hard part; public acceptance is. Where reuse programmes have failed, they have almost always failed on communication rather than engineering.</p>
<h2>Agriculture is the real number</h2>
<p>About seventy per cent of global freshwater use is agricultural, which means that household conservation, however worthwhile, addresses a small fraction of the total. Shifting from flood irrigation to drip systems can cut field water use by a third to a half, and choosing crops suited to the local climate can save more than any technology.</p>$t$,
   'B2', 6,
   $v$[
     {"word":"scarcity","meaning":"tanqislik","example":"Water scarcity is rarely about absolute quantity."},
     {"word":"distribution","meaning":"taqsimot","example":"Distribution networks leak a lot of water."},
     {"word":"acceptance","meaning":"qabul qilish, rozilik","example":"Public acceptance is the hard part."},
     {"word":"conservation","meaning":"tejash, asrash","example":"Household conservation is worthwhile but small."},
     {"word":"irrigation","meaning":"sug'orish","example":"Drip irrigation saves water."}
   ]$v$::jsonb,
   true, true, 7),

  ('d0000000-0000-4000-8000-000000000008', 'the-weak-ties-that-hold-us',
   'The Weak Ties That Hold Us Together', 'society',
   'Yaqin do''stlar emas, tanish-bilishlar tarmog''i nega muhimroq bo''lishi mumkin.',
   $t$<p>In 1973 a sociologist named Mark Granovetter published a paper with a deliberately awkward title: "The Strength of Weak Ties". He had asked people how they found their current job, expecting to hear about close friends. Most had heard about it from an acquaintance — someone they saw rarely and knew slightly.</p>
<h2>Why distance helps</h2>
<p>The explanation is structural. Close friends tend to know the same people and hear the same news as we do. An acquaintance moves in a different circle and therefore carries information that has not already reached us. Weak ties are bridges between clusters, and information travels along bridges.</p>
<h2>Confirmed at scale</h2>
<p>For decades the finding rested on interviews with a few hundred people. Then, in 2022, researchers ran a large experiment on a professional network, varying the strength of the connections suggested to millions of users. Moderately weak ties produced measurably more job mobility than strong ones — the first causal evidence for a claim that had been assumed for half a century.</p>
<h2>What follows</h2>
<p>The practical implication is not that close friendships matter less. It is that a social life composed entirely of close friends is, in one specific respect, a narrow one. The colleague you speak to twice a year is doing something your best friend cannot.</p>$t$,
   'C1', 6,
   $v$[
     {"word":"acquaintance","meaning":"tanish (kishi)","example":"Most people heard about the job from an acquaintance."},
     {"word":"cluster","meaning":"guruh, to'da","example":"Weak ties are bridges between clusters."},
     {"word":"mobility","meaning":"harakatchanlik","example":"Weak ties produced more job mobility."},
     {"word":"implication","meaning":"xulosa, oqibat","example":"The practical implication is clear."},
     {"word":"causal","meaning":"sababiy","example":"The first causal evidence for the claim."}
   ]$v$::jsonb,
   true, true, 8)
on conflict (id) do update set
  title = excluded.title, body = excluded.body, excerpt = excluded.excerpt,
  vocabulary = excluded.vocabulary, is_premium = excluded.is_premium;

-- Maqola savollari (birinchi 4 ta maqola uchun)
insert into public.article_questions (id, article_id, kind, prompt, options, correct_answer, explanation, order_index)
values
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'true_false_ng', 'During deep sleep the spaces between brain cells become larger.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"TRUE"'::jsonb,
   '"...spaces between brain cells expand by as much as sixty per cent."', 1),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001',
   'mcq', 'Which protein is mentioned in connection with Alzheimer''s disease?',
   '["Collagen","Beta-amyloid","Keratin","Insulin"]'::jsonb, '"Beta-amyloid"'::jsonb,
   'Ikkinchi bo''limda aytilgan.', 2),
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001',
   'gap_fill', 'The ______ replays the day''s experiences to the cortex.',
   '[]'::jsonb, '["hippocampus"]'::jsonb, '"Sorting the day" bo''limi.', 3),
  ('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001',
   'true_false_ng', 'People who sleep six hours a night correctly judge how tired they are.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"FALSE"'::jsonb,
   '"We are poor judges of our own tiredness."', 4),

  ('e0000000-0000-4000-8000-000000000011', 'd0000000-0000-4000-8000-000000000002',
   'mcq', 'What does the writer say makes modern algorithms politically interesting?',
   '["Their speed","The shift from sorting to deciding","Their cost","Their size"]'::jsonb,
   '"The shift from sorting to deciding"'::jsonb, '"From sorting to deciding" bo''limi.', 1),
  ('e0000000-0000-4000-8000-000000000012', 'd0000000-0000-4000-8000-000000000002',
   'gap_fill', 'Data such as education or postcode is treated as a ______ for ability.',
   '[]'::jsonb, '["proxy"]'::jsonb, '"The problem of proxies" bo''limi.', 2),
  ('e0000000-0000-4000-8000-000000000013', 'd0000000-0000-4000-8000-000000000002',
   'true_false_ng', 'The writer argues that algorithms should not be used.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"FALSE"'::jsonb,
   'Oxirgi xatboshi: "None of this argues against using algorithms."', 3),

  ('e0000000-0000-4000-8000-000000000021', 'd0000000-0000-4000-8000-000000000003',
   'mcq', 'Which hormone is released within seconds?',
   '["Cortisol","Adrenaline","Insulin","Melatonin"]'::jsonb, '"Adrenaline"'::jsonb,
   '"Two systems, two speeds" bo''limi.', 1),
  ('e0000000-0000-4000-8000-000000000022', 'd0000000-0000-4000-8000-000000000003',
   'true_false_ng', 'According to the text, damage comes mainly from how long stress lasts.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"TRUE"'::jsonb,
   '"The damage comes from duration, not intensity."', 2),
  ('e0000000-0000-4000-8000-000000000023', 'd0000000-0000-4000-8000-000000000003',
   'gap_fill', 'Perceived ______ predicted health outcomes as strongly as smoking.',
   '[]'::jsonb, '["loneliness"]'::jsonb, '"What helps" bo''limi.', 3),

  ('e0000000-0000-4000-8000-000000000031', 'd0000000-0000-4000-8000-000000000004',
   'gap_fill', 'How well a test''s questions sample what it claims to measure is called ______.',
   '[]'::jsonb, '["validity"]'::jsonb, '"The measurement problem" bo''limi.', 1),
  ('e0000000-0000-4000-8000-000000000032', 'd0000000-0000-4000-8000-000000000004',
   'mcq', 'Why do modern language exams report four separate scores?',
   '["To make marking easier","Because a learner may be strong in one skill and weak in another","To increase the fee","Because of tradition"]'::jsonb,
   '"Because a learner may be strong in one skill and weak in another"'::jsonb,
   '"Four skills, four scores" bo''limi.', 2),
  ('e0000000-0000-4000-8000-000000000033', 'd0000000-0000-4000-8000-000000000004',
   'true_false_ng', 'Rereading improves results more reliably than practice tests.',
   '["TRUE","FALSE","NOT GIVEN"]'::jsonb, '"FALSE"'::jsonb,
   '"Testing as learning" bo''limi — aksincha.', 3)
on conflict (id) do update set prompt = excluded.prompt, correct_answer = excluded.correct_answer;

-- ============================================================================
-- 6) VOCABULARY BATTLE  (hujjat: 6-bo'lim)
-- ============================================================================
insert into public.vocab_packs (id, slug, title, description, level, emoji, is_premium, published, order_index)
values
  ('f0000000-0000-4000-8000-000000000001', 'multilevel-essentials',
   'Multilevel Essentials', 'Imtihonda eng ko''p uchraydigan 20 ta so''z.', 'B1', '🎯', false, true, 1),
  ('f0000000-0000-4000-8000-000000000002', 'academic-verbs',
   'Academic Verbs', 'Writing va Speaking uchun kuchli fe''llar.', 'B2', '✍️', false, true, 2),
  ('f0000000-0000-4000-8000-000000000003', 'everyday-english',
   'Everyday English', 'Kundalik muloqot uchun so''zlar.', 'A2', '☕', false, true, 3),
  ('f0000000-0000-4000-8000-000000000004', 'advanced-c1',
   'Advanced C1 Words', 'Yuqori daraja uchun murakkab so''zlar.', 'C1', '🚀', true, true, 4)
on conflict (id) do update set title = excluded.title, is_premium = excluded.is_premium;

insert into public.vocab_words (id, pack_id, word, meaning_uz, example, options, correct_index, order_index)
values
  -- Multilevel Essentials
  ('10000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001','achievement','yutuq','Winning the scholarship was a great achievement.','["Maqsad","Yutuq","Imkoniyat","Mas''uliyat"]'::jsonb,1,1),
  ('10000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000001','opportunity','imkoniyat','This job is a real opportunity.','["Imkoniyat","Qiyinchilik","Majburiyat","Tajriba"]'::jsonb,0,2),
  ('10000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000001','responsible','mas''uliyatli','She is responsible for the whole team.','["Ishonchsiz","Beparvo","Mas''uliyatli","Qat''iy"]'::jsonb,2,3),
  ('10000000-0000-4000-8000-000000000004','f0000000-0000-4000-8000-000000000001','improve','yaxshilamoq','Reading helps you improve your vocabulary.','["Kamaytirmoq","Yaxshilamoq","Boshlamoq","Tugatmoq"]'::jsonb,1,4),
  ('10000000-0000-4000-8000-000000000005','f0000000-0000-4000-8000-000000000001','decision','qaror','It was a difficult decision.','["Fikr","Qaror","Savol","Taklif"]'::jsonb,1,5),
  ('10000000-0000-4000-8000-000000000006','f0000000-0000-4000-8000-000000000001','experience','tajriba','He has ten years of experience.','["Tajriba","Ta''lim","Malaka oshirish","Guvohnoma"]'::jsonb,0,6),
  ('10000000-0000-4000-8000-000000000007','f0000000-0000-4000-8000-000000000001','environment','atrof-muhit','We must protect the environment.','["Jamiyat","Atrof-muhit","Iqtisodiyot","Madaniyat"]'::jsonb,1,7),
  ('10000000-0000-4000-8000-000000000008','f0000000-0000-4000-8000-000000000001','available','mavjud, bo''sh','The book is available in the library.','["Qimmat","Yopiq","Mavjud","Eskirgan"]'::jsonb,2,8),
  ('10000000-0000-4000-8000-000000000009','f0000000-0000-4000-8000-000000000001','reduce','kamaytirmoq','We need to reduce plastic waste.','["Ko''paytirmoq","Kamaytirmoq","O''lchamoq","Saqlamoq"]'::jsonb,1,9),
  ('10000000-0000-4000-8000-00000000000a','f0000000-0000-4000-8000-000000000001','encourage','rag''batlantirmoq','Teachers encourage students to read.','["Taqiqlamoq","To''sqinlik qilmoq","Rag''batlantirmoq","Tanqid qilmoq"]'::jsonb,2,10),
  ('10000000-0000-4000-8000-00000000000b','f0000000-0000-4000-8000-000000000001','significant','muhim, sezilarli','There was a significant change.','["Arzimas","Muhim","Tasodifiy","Yashirin"]'::jsonb,1,11),
  ('10000000-0000-4000-8000-00000000000c','f0000000-0000-4000-8000-000000000001','require','talab qilmoq','This job requires patience.','["Taklif qilmoq","Talab qilmoq","Ruxsat bermoq","Unutmoq"]'::jsonb,1,12),
  ('10000000-0000-4000-8000-00000000000d','f0000000-0000-4000-8000-000000000001','benefit','foyda','Exercise has many benefits.','["Zarar","Foyda","Xarajat","Xavf"]'::jsonb,1,13),
  ('10000000-0000-4000-8000-00000000000e','f0000000-0000-4000-8000-000000000001','purpose','maqsad','What is the purpose of this meeting?','["Natija","Sabab","Maqsad","Usul"]'::jsonb,2,14),
  ('10000000-0000-4000-8000-00000000000f','f0000000-0000-4000-8000-000000000001','common','keng tarqalgan','This is a common mistake.','["Noyob","Keng tarqalgan","Qimmat","Yangi"]'::jsonb,1,15),
  ('10000000-0000-4000-8000-000000000010','f0000000-0000-4000-8000-000000000001','prevent','oldini olmoq','Vaccines prevent disease.','["Oldini olmoq","Davolamoq","Tarqatmoq","Aniqlamoq"]'::jsonb,0,16),
  ('10000000-0000-4000-8000-000000000011','f0000000-0000-4000-8000-000000000001','increase','oshirmoq','Prices continue to increase.','["Kamaymoq","Oshirmoq","To''xtamoq","Bo''linmoq"]'::jsonb,1,17),
  ('10000000-0000-4000-8000-000000000012','f0000000-0000-4000-8000-000000000001','various','turli xil','The shop sells various products.','["Bir xil","Turli xil","Kam","Yashirin"]'::jsonb,1,18),
  ('10000000-0000-4000-8000-000000000013','f0000000-0000-4000-8000-000000000001','support','qo''llab-quvvatlamoq','My family supports my decision.','["Qarshi chiqmoq","Qo''llab-quvvatlamoq","Shubhalanmoq","E''tiborsiz qoldirmoq"]'::jsonb,1,19),
  ('10000000-0000-4000-8000-000000000014','f0000000-0000-4000-8000-000000000001','consider','hisobga olmoq','Please consider my request.','["Rad etmoq","Hisobga olmoq","Unutmoq","Tanqid qilmoq"]'::jsonb,1,20),

  -- Academic Verbs
  ('10000000-0000-4000-8000-000000000021','f0000000-0000-4000-8000-000000000002','illustrate','ko''rsatib bermoq','The graph illustrates the trend.','["Yashirmoq","Ko''rsatib bermoq","Inkor qilmoq","Takrorlamoq"]'::jsonb,1,1),
  ('10000000-0000-4000-8000-000000000022','f0000000-0000-4000-8000-000000000002','demonstrate','isbotlamoq','The study demonstrates a clear link.','["Isbotlamoq","Taxmin qilmoq","So''ramoq","Kutmoq"]'::jsonb,0,2),
  ('10000000-0000-4000-8000-000000000023','f0000000-0000-4000-8000-000000000002','emphasise','ta''kidlamoq','I want to emphasise this point.','["Ta''kidlamoq","Yumshatmoq","Chetlab o''tmoq","Qisqartirmoq"]'::jsonb,0,3),
  ('10000000-0000-4000-8000-000000000024','f0000000-0000-4000-8000-000000000002','analyse','tahlil qilmoq','We analysed the results carefully.','["Sanamoq","Tahlil qilmoq","Nusxalamoq","Chop etmoq"]'::jsonb,1,4),
  ('10000000-0000-4000-8000-000000000025','f0000000-0000-4000-8000-000000000002','indicate','ko''rsatmoq','The data indicates a rise.','["Ko''rsatmoq","Yashirmoq","Rad etmoq","Kutmoq"]'::jsonb,0,5),
  ('10000000-0000-4000-8000-000000000026','f0000000-0000-4000-8000-000000000002','contribute','hissa qo''shmoq','Everyone contributed to the project.','["Buzmoq","Hissa qo''shmoq","Kuzatmoq","So''ramoq"]'::jsonb,1,6),
  ('10000000-0000-4000-8000-000000000027','f0000000-0000-4000-8000-000000000002','establish','tashkil etmoq','The school was established in 1990.','["Yopmoq","Tashkil etmoq","Ko''chirmoq","Sotmoq"]'::jsonb,1,7),
  ('10000000-0000-4000-8000-000000000028','f0000000-0000-4000-8000-000000000002','maintain','saqlab qolmoq','It is hard to maintain high standards.','["Tashlab ketmoq","Saqlab qolmoq","Pasaytirmoq","Almashtirmoq"]'::jsonb,1,8),
  ('10000000-0000-4000-8000-000000000029','f0000000-0000-4000-8000-000000000002','assess','baholamoq','Teachers assess student progress.','["Baholamoq","O''rgatmoq","Yozmoq","Kuzatmoq"]'::jsonb,0,9),
  ('10000000-0000-4000-8000-00000000002a','f0000000-0000-4000-8000-000000000002','reveal','oshkor qilmoq','The report revealed serious errors.','["Yashirmoq","Oshkor qilmoq","Tuzatmoq","Bekor qilmoq"]'::jsonb,1,10),

  -- Everyday English
  ('10000000-0000-4000-8000-000000000031','f0000000-0000-4000-8000-000000000003','borrow','qarzga olmoq','Can I borrow your pen?','["Qarz bermoq","Qarzga olmoq","Sotib olmoq","Sovg''a qilmoq"]'::jsonb,1,1),
  ('10000000-0000-4000-8000-000000000032','f0000000-0000-4000-8000-000000000003','expensive','qimmat','That phone is too expensive.','["Arzon","Qimmat","Bepul","Eski"]'::jsonb,1,2),
  ('10000000-0000-4000-8000-000000000033','f0000000-0000-4000-8000-000000000003','tired','charchagan','I feel tired after work.','["Baxtli","Charchagan","Ochiqqan","Qo''rqqan"]'::jsonb,1,3),
  ('10000000-0000-4000-8000-000000000034','f0000000-0000-4000-8000-000000000003','neighbour','qo''shni','Our neighbour is very kind.','["Qo''shni","Qarindosh","Do''st","Hamkasb"]'::jsonb,0,4),
  ('10000000-0000-4000-8000-000000000035','f0000000-0000-4000-8000-000000000003','arrive','yetib kelmoq','The train arrives at six.','["Jo''namoq","Yetib kelmoq","Kutmoq","Kechikmoq"]'::jsonb,1,5),
  ('10000000-0000-4000-8000-000000000036','f0000000-0000-4000-8000-000000000003','busy','band','Sorry, I am busy today.','["Bo''sh","Band","Kasal","Xursand"]'::jsonb,1,6),
  ('10000000-0000-4000-8000-000000000037','f0000000-0000-4000-8000-000000000003','remember','eslamoq','I cannot remember his name.','["Unutmoq","Eslamoq","Bilmoq","O''rganmoq"]'::jsonb,1,7),
  ('10000000-0000-4000-8000-000000000038','f0000000-0000-4000-8000-000000000003','choose','tanlamoq','You can choose any colour.','["Tanlamoq","Rad etmoq","Yo''qotmoq","Sotmoq"]'::jsonb,0,8),

  -- Advanced C1 (Premium)
  ('10000000-0000-4000-8000-000000000041','f0000000-0000-4000-8000-000000000004','ubiquitous','hamma joyda uchraydigan','Smartphones are now ubiquitous.','["Noyob","Hamma joyda uchraydigan","Qimmat","Eskirgan"]'::jsonb,1,1),
  ('10000000-0000-4000-8000-000000000042','f0000000-0000-4000-8000-000000000004','meticulous','juda sinchkov','She is meticulous about details.','["Beparvo","Juda sinchkov","Shoshqaloq","Dangasa"]'::jsonb,1,2),
  ('10000000-0000-4000-8000-000000000043','f0000000-0000-4000-8000-000000000004','inevitable','muqarrar','Change is inevitable.','["Muqarrar","Kutilmagan","Imkonsiz","Ixtiyoriy"]'::jsonb,0,3),
  ('10000000-0000-4000-8000-000000000044','f0000000-0000-4000-8000-000000000004','ambiguous','ikki ma''noli','His answer was ambiguous.','["Aniq","Ikki ma''noli","Qisqa","Yolg''on"]'::jsonb,1,4),
  ('10000000-0000-4000-8000-000000000045','f0000000-0000-4000-8000-000000000004','compelling','ishonarli, jozibali','She made a compelling argument.','["Zaif","Ishonarli","Zerikarli","Uzun"]'::jsonb,1,5),
  ('10000000-0000-4000-8000-000000000046','f0000000-0000-4000-8000-000000000004','scrutiny','sinchkov tekshiruv','The plan came under scrutiny.','["Maqtov","Sinchkov tekshiruv","E''tiborsizlik","Qo''llab-quvvatlash"]'::jsonb,1,6),
  ('10000000-0000-4000-8000-000000000047','f0000000-0000-4000-8000-000000000004','prevalent','keng tarqalgan','The habit is prevalent among students.','["Kam uchraydigan","Keng tarqalgan","Taqiqlangan","Foydali"]'::jsonb,1,7),
  ('10000000-0000-4000-8000-000000000048','f0000000-0000-4000-8000-000000000004','mitigate','yumshatmoq','Steps to mitigate the damage.','["Kuchaytirmoq","Yumshatmoq","Yashirmoq","O''lchamoq"]'::jsonb,1,8)
on conflict (id) do update set
  word = excluded.word, meaning_uz = excluded.meaning_uz,
  options = excluded.options, correct_index = excluded.correct_index;

-- ============================================================================
-- 7) OFFLINE KURSLAR  (hujjat: 14-bo'lim)
-- ============================================================================
insert into public.courses
  (id, slug, title, level, summary, description, duration, days, time_text, price, address, seats, published, order_index)
values
  ('20000000-0000-4000-8000-000000000001', 'multilevel-b1',
   'Multilevel B1 Course', 'B1',
   'Noldan B1 darajasiga: grammatika, lug''at va imtihon strategiyalari.',
   $t$Kurs Multilevel imtihonining B1 darajasiga tayyorlaydi. Har bir darsda to'rt ko'nikma (Reading, Listening, Writing, Speaking) ustida ishlanadi. Har hafta mini-test, har oyda to'liq mock test o'tkaziladi. Guruhda 10–12 nafar o'quvchi bo'ladi.$t$,
   '4 oy', 'Dushanba · Chorshanba · Juma', '18:00 – 20:00', '600 000 so''m / oy',
   'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko''chasi 12', 12, true, 1),

  ('20000000-0000-4000-8000-000000000002', 'multilevel-b2',
   'Multilevel B2 Course', 'B2',
   'B1 dan B2 ga: murakkab matnlar, esse yozish va ravon nutq.',
   $t$B2 kursi allaqachon asosiy grammatikani biladigan o'quvchilar uchun. Asosiy e'tibor: akademik lug'at, Writing Task 2 tuzilishi, Speaking Part 2–3 uchun fikrni kengaytirish. Har darsda yozma ish tekshiriladi va individual fikr-mulohaza beriladi.$t$,
   '4 oy', 'Seshanba · Payshanba · Shanba', '16:00 – 18:00', '700 000 so''m / oy',
   'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko''chasi 12', 12, true, 2),

  ('20000000-0000-4000-8000-000000000003', 'intensive-multilevel',
   'Intensive Multilevel Course', 'B2–C1',
   'Imtihonga 2 oy qolganlar uchun kuchaytirilgan kurs.',
   $t$Intensiv kurs imtihon sanasi yaqin bo'lgan o'quvchilar uchun. Haftasiga 5 kun dars, har hafta to'liq mock test va o'qituvchi tomonidan batafsil tahlil. Speaking uchun haftada 2 marta individual mashg'ulot.$t$,
   '2 oy', 'Dushanba – Juma', '09:00 – 12:00', '1 200 000 so''m / oy',
   'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko''chasi 12', 8, true, 3)
on conflict (id) do update set
  title = excluded.title, description = excluded.description, price = excluded.price;
