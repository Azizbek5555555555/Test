import { EXAMINER_NAME, REVIEW_HOURS } from "@/lib/constants";
import { LR_TABLE, LEVEL_BANDS, MAX_SCORE } from "@/lib/scoring";
import { getT } from "@/i18n/server";
import { Reveal } from "@/components/motion/Reveal";

/** Jadvaldan namunaviy qatorlar: to'g'ri javoblar soni → ball */
const SAMPLE_ROWS = [10, 14, 18, 23, 28, 33];

/**
 * "Natija qanday hisoblanadi" — rasmiy Multilevel baholash tizimi
 * (Bilimni baholash agentligi mezonlari asosida).
 */
export async function ScoringGuide() {
  const t = await getT();
  const sections = [
    {
      name: "Listening",
      lines: [t("35 ta savol", "35 questions"), t("To'g'ri javoblar soni rasmiy jadval bo'yicha ballga aylanadi", "Correct answers convert to a score via the official table")],
    },
    {
      name: "Reading",
      lines: [t("35 ta savol", "35 questions"), t("To'g'ri javoblar soni rasmiy jadval bo'yicha ballga aylanadi", "Correct answers convert to a score via the official table")],
    },
    {
      name: "Writing",
      lines: [
        t("Task 1.1 (0–5) + Task 1.2 (0–6) + Part 2 (0–6) = 0–17", "Task 1.1 (0–5) + Task 1.2 (0–6) + Part 2 (0–6) = 0–17"),
        t("Ekspert bali rasmiy jadval bo'yicha ballga aylanadi (masalan, 8 → 45, 12 → 57)", "The expert mark converts via the official table (e.g. 8 → 45, 12 → 57)"),
      ],
    },
    {
      name: "Speaking",
      lines: [
        t("8 ta savol: 1–3, 4–6, 7 va 8-savollar rasmiy mezonlar bilan baholanadi", "8 questions: 1–3, 4–6, 7 and 8 are marked against the official criteria"),
        t("Ekspert bahosi 0–75 shkalaga o'tkaziladi", "The examiner's mark is converted to the 0–75 scale"),
      ],
    },
  ];

  return (
    <section className="sg">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">
          {t("Rasmiy baholash tizimi", "Official scoring system")}
        </p>
        <h2 className="display-title mt-1 text-[32px]">{t("Natija qanday hisoblanadi", "How your result is calculated")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {t(
            `Har bir bo'lim ${MAX_SCORE} ballik shkalada baholanadi. Umumiy ball — 4 bo'lim o'rtachasi (0–${MAX_SCORE}); daraja shu ball bo'yicha aniqlanadi.`,
            `Each section is scored on a ${MAX_SCORE}-point scale. Your overall score is the average of the 4 sections (0–${MAX_SCORE}), and your level is based on it.`,
          )}
        </p>
      </Reveal>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s, i) => (
          <Reveal key={s.name} delay={i * 70} className="sg-card">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[15px] font-semibold text-fg">{s.name}</p>
              <p className="font-display text-3xl text-gold-400 lining-nums">
                {MAX_SCORE}
                <small className="ml-1 text-xs text-muted">{t("ball", "pts")}</small>
              </p>
            </div>
            <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-muted">
              {s.lines.map((l) => (
                <li key={l}>• {l}</li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Reveal className="sg-card">
          <p className="text-sm font-semibold text-fg">
            {t("Listening va Reading: to'g'ri javoblar → ball", "Listening & Reading: correct answers → score")}
          </p>
          <table className="sg-table mt-3">
            <thead>
              <tr>
                <th>{t("To'g'ri javob", "Correct")}</th>
                {SAMPLE_ROWS.map((n) => (
                  <th key={n}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Listening</td>
                {SAMPLE_ROWS.map((n) => (
                  <td key={n}>{LR_TABLE.listening[n - 1]}</td>
                ))}
              </tr>
              <tr>
                <td>Reading</td>
                {SAMPLE_ROWS.map((n) => (
                  <td key={n}>{LR_TABLE.reading[n - 1]}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-faint">
            {t(
              "Jadvalda o'rtacha natijalar keltirilgan; savollar soni boshqacha bo'lgan testlarda natija 35 savollik ekvivalentga keltiriladi.",
              "The table shows typical values; tests with a different number of questions are scaled to a 35-question equivalent.",
            )}
          </p>
        </Reveal>

        <Reveal delay={80} className="sg-card">
          <p className="text-sm font-semibold text-fg">{t("Daraja (umumiy ball bo'yicha)", "Level (by overall score)")}</p>
          <ul className="mt-3 space-y-2">
            {LEVEL_BANDS.map((b) => (
              <li key={b.level} className="sg-band">
                <span className="sg-level">{b.level}</span>
                <span className="text-sm text-fg tabular-nums">
                  {b.from}–{b.to} {t("ball", "points")}
                </span>
              </li>
            ))}
            <li className="sg-band sg-band-low">
              <span className="sg-level">&lt; B1</span>
              <span className="text-sm text-muted">
                {t("38 balldan kam — sertifikat berilmaydi", "Below 38 — no certificate is issued")}
              </span>
            </li>
          </ul>
          <p className="mt-4 rounded-lg border border-line bg-ink-900/60 px-3 py-2.5 text-[13px] leading-relaxed text-muted">
            {t(
              `Writing va Speaking javoblarini tekshiruvchi ${EXAMINER_NAME} ${REVIEW_HOURS} soat ichida rasmiy mezonlar bo'yicha baholaydi.`,
              `Writing and Speaking answers are graded by our examiner ${EXAMINER_NAME} against the official criteria within ${REVIEW_HOURS} hours.`,
            )}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
