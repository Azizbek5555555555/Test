import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Edit3,
  FileText,
  Headphones,
  Layers,
  Mic,
  Target,
} from "react-feather";
import { getT } from "@/i18n/server";
import { intlLocale } from "@/i18n";
import { Reveal } from "@/components/motion/Reveal";
import { SECTIONS, SECTION_LABEL } from "@/lib/constants";
import { MAX_SCORE, scorePercent } from "@/lib/scoring";
import { levelFor, practiceHref, type LearnerHomeData } from "@/lib/learner-home";
import type { CefrBands, SkillSection } from "@/lib/types";
import { TrendChart } from "./TrendChart";

type IconType = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

const SKILL_ICON: Record<SkillSection, IconType> = {
  reading: BookOpen,
  listening: Headphones,
  writing: Edit3,
  speaking: Mic,
};

/**
 * Hero ostidagi o'quvchiga foydali bloklar:
 *  1) Natijalar — ball dinamikasi, keyingi daraja maqsadi, 4 ko'nikma;
 *  2) Bugungi reja (avtomatik belgilanadi) va oxirgi faoliyat.
 */
export async function LearnerPanels({ data, bands }: { data: LearnerHomeData; bands: CefrBands }) {
  const t = await getT();
  const fmt = new Intl.DateTimeFormat(intlLocale(t.locale), { day: "numeric", month: "short" });
  const bandLines = [
    { level: "B1", at: bands.B1 },
    { level: "B2", at: bands.B2 },
    { level: "C1", at: bands.C1 },
  ];

  const weakHref = data.next.section ? practiceHref(data.next.section) : "/full-mock";
  const plan = [
    {
      done: data.today.vocab,
      icon: Layers,
      title: t("20 ta so'z — Vocabulary Battle", "20 words — Vocabulary Battle"),
      hint: t("5 daqiqa", "5 minutes"),
      href: "/vocabulary-battle",
    },
    {
      done: data.today.reading,
      icon: BookOpen,
      title: t("Bitta maqola o'qing", "Read one article"),
      hint: t("10 daqiqa", "10 minutes"),
      href: "/boost/articles",
    },
    {
      done: data.today.practice,
      icon: FileText,
      title: data.next.section
        ? t(`${SECTION_LABEL[data.next.section]} bo'yicha bitta mashq`, `One ${SECTION_LABEL[data.next.section]} practice`)
        : t("Bitta test ishlang", "Take one test"),
      hint: t("15–30 daqiqa", "15–30 minutes"),
      href: data.next.kind === "continue" ? data.next.href : weakHref,
    },
  ];
  const doneCount = plan.filter((p) => p.done).length;

  const statusChip = (s: LearnerHomeData["recent"][number]["status"]) =>
    s === "graded"
      ? { label: t("Baholandi", "Graded"), tone: "lp-chip-ok" }
      : s === "submitted"
        ? { label: t("Tekshirilmoqda", "Being checked"), tone: "lp-chip-wait" }
        : { label: t("Jarayonda", "In progress"), tone: "lp-chip-live" };

  return (
    <div className="lp container-page">
      {/* ================================================= NATIJALAR */}
      <Reveal className="lp-head">
        <p className="eyebrow">
          <span className="h-px w-5 bg-brand-400" aria-hidden />
          {t("Sizning natijalaringiz", "Your results")}
        </p>
        <h2 className="display-title text-4xl sm:text-[44px]">{t("Cho'qqi sari yo'lingiz", "Your climb so far")}</h2>
      </Reveal>

      <div className="lp-grid-results">
        <Reveal className="lp-card lp-trend">
          <div className="lp-card-head">
            <div>
              <p className="lp-k">{t("Umumiy ball dinamikasi", "Overall score trend")}</p>
              <p className="lp-sub">
                {data.trend.length
                  ? t(`Oxirgi ${data.trend.length} ta natija · rasmiy 0–${MAX_SCORE} shkala`, `Last ${data.trend.length} results · official 0–${MAX_SCORE} scale`)
                  : t(`Rasmiy 0–${MAX_SCORE} shkala`, `Official 0–${MAX_SCORE} scale`)}
              </p>
            </div>
            <Link href="/profile/results" className="lp-link">
              {t("Barchasi", "All results")} <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
          {data.trend.length ? (
            <TrendChart points={data.trend} bands={bandLines} />
          ) : (
            <div className="lp-empty">
              <p>{t("Birinchi natijangiz shu yerda chiziladi.", "Your first result will be drawn here.")}</p>
              <Link href="/full-mock" className="lp-btn">
                {t("Full Mock ishlash", "Take a Full Mock")} <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          )}
        </Reveal>

        <Reveal delay={80} className="lp-card lp-target">
          <p className="lp-k">
            <Target size={14} aria-hidden /> {t("Keyingi maqsad", "Next goal")}
          </p>
          {data.overall == null ? (
            <>
              <p className="lp-target-level">?</p>
              <p className="lp-sub">
                {t("Darajangizni bilish uchun bitta to'liq test ishlang.", "Take one full test to find out your level.")}
              </p>
              <Link href="/full-mock" className="lp-btn">
                {t("Darajani aniqlash", "Find my level")} <ArrowRight size={14} aria-hidden />
              </Link>
            </>
          ) : data.target ? (
            <>
              <p className="lp-target-level">
                {data.target.level}
                <span>
                  {t(`${data.target.need} ball qoldi`, `${data.target.need} ${data.target.need === 1 ? "point" : "points"} to go`)}
                </span>
              </p>
              <div
                className="lp-meter"
                role="meter"
                aria-valuemin={data.target.from}
                aria-valuemax={data.target.to}
                aria-valuenow={data.overall}
                aria-label={t("Maqsadga yaqinlik", "Progress to goal")}
              >
                <span
                  style={{
                    width: `${Math.max(4, Math.min(100, ((data.overall - data.target.from) / Math.max(1, data.target.to - data.target.from)) * 100))}%`,
                  }}
                />
              </div>
              <p className="lp-meter-scale">
                <span>
                  {data.level} · {data.overall}
                </span>
                <span>
                  {data.target.level} · {data.target.to}
                </span>
              </p>
              <p className="lp-sub">
                {t(
                  "Umumiy ball — 4 bo'lim o'rtachasi. Eng past bo'limni ko'tarish eng tez natija beradi.",
                  "Your overall score is the average of 4 sections. Raising your lowest section pays off fastest.",
                )}
              </p>
            </>
          ) : (
            <>
              <p className="lp-target-level">
                C1<span>{t("Eng yuqori daraja!", "Top level reached!")}</span>
              </p>
              <p className="lp-sub">
                {t("Natijani barqaror ushlab turish uchun haftada bitta Full Mock ishlang.", "Take one Full Mock a week to keep it steady.")}
              </p>
            </>
          )}
        </Reveal>
      </div>

      <div className="lp-skills">
        {SECTIONS.map((s, i) => {
          const Icon = SKILL_ICON[s];
          const v = data.skills[s];
          const lvl = levelFor(v, bands);
          return (
            <Reveal key={s} delay={i * 70} className="lp-card lp-skill">
              <div className="flex items-center justify-between">
                <span className="lp-ico">
                  <Icon size={18} strokeWidth={1.8} aria-hidden />
                </span>
                {lvl ? <span className="lp-level">{lvl === "A2" ? t("B1 dan quyi", "Below B1") : lvl}</span> : null}
              </div>
              <p className="lp-skill-name">{SECTION_LABEL[s]}</p>
              <p className="lp-skill-score">
                {v ?? "—"}
                <small>/{MAX_SCORE}</small>
              </p>
              <div className="lp-bar" aria-hidden>
                <span style={{ width: `${scorePercent(v)}%` }} />
              </div>
              <Link href={practiceHref(s)} className="lp-link">
                {v == null ? t("Boshlash", "Start") : t("Mashq qilish", "Practise")} <ArrowRight size={14} aria-hidden />
              </Link>
            </Reveal>
          );
        })}
      </div>

      {/* ================================================= BUGUN + FAOLIYAT */}
      <div className="lp-grid-day">
        <Reveal className="lp-card lp-plan">
          <div className="lp-card-head">
            <div>
              <p className="lp-k">{t("Bugungi reja", "Today's plan")}</p>
              <p className="lp-sub">
                {doneCount === plan.length
                  ? t("Ajoyib! Bugungi reja bajarildi 🎉", "Great! Today's plan is done 🎉")
                  : t(`${doneCount} / ${plan.length} bajarildi`, `${doneCount} / ${plan.length} done`)}
              </p>
            </div>
            <span className="lp-plan-ring" style={{ "--p": doneCount / plan.length } as React.CSSProperties} aria-hidden>
              <b>{doneCount}</b>
            </span>
          </div>
          <ul className="lp-plan-list">
            {plan.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.title}>
                  <Link href={p.href} className="lp-plan-item" data-done={p.done || undefined}>
                    <span className="lp-check" aria-hidden>
                      {p.done ? <Check size={14} strokeWidth={3} /> : <Icon size={15} strokeWidth={1.8} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="lp-plan-title">{p.title}</span>
                      <span className="lp-plan-hint">
                        {p.done ? t("Bajarildi", "Done") : p.hint}
                      </span>
                    </span>
                    <ArrowRight size={15} className="lp-plan-arrow" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
          <dl className="lp-totals">
            <div>
              <dt>{t("Testlar", "Tests")}</dt>
              <dd>{data.totals.tests}</dd>
            </div>
            <div>
              <dt>{t("Topilgan so'zlar", "Words right")}</dt>
              <dd>{data.totals.words}</dd>
            </div>
            <div>
              <dt>{t("Maqolalar", "Articles")}</dt>
              <dd>{data.totals.articles}</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={80} className="lp-card lp-recent">
          <div className="lp-card-head">
            <div>
              <p className="lp-k">{t("Oxirgi faoliyat", "Recent activity")}</p>
              <p className="lp-sub">
                {data.totals.pending
                  ? t(
                      `${data.totals.pending} ta ish tekshiruvchida — 24 soat ichida baholanadi`,
                      `${data.totals.pending} ${data.totals.pending === 1 ? "paper is" : "papers are"} with the examiner — graded within 24 hours`,
                    )
                  : t("Testlar va natijalar", "Tests and results")}
              </p>
            </div>
            <Link href="/profile/results" className="lp-link">
              {t("Barchasi", "All")} <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
          {data.recent.length ? (
            <ul className="lp-recent-list">
              {data.recent.map((r) => {
                const chip = statusChip(r.status);
                return (
                  <li key={r.id}>
                    <Link href={r.href} className="lp-recent-item">
                      <span className="lp-recent-ico" aria-hidden>
                        {r.status === "graded" ? <Check size={15} /> : <Clock size={15} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="lp-recent-title">{r.title}</span>
                        <span className="lp-recent-date">{fmt.format(new Date(r.at))}</span>
                      </span>
                      {r.score != null ? (
                        <span className="lp-recent-score">
                          {r.score}
                          <small>/{MAX_SCORE}</small>
                          {r.cefr ? <em>{r.cefr === "A2" ? "<B1" : r.cefr}</em> : null}
                        </span>
                      ) : (
                        <span className={`lp-chip ${chip.tone}`}>{chip.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="lp-empty">
              <p>{t("Hali test ishlamagansiz. Birinchi qadamni bugun qo'ying!", "No tests yet. Take your first step today!")}</p>
              <Link href="/full-mock" className="lp-btn">
                {t("Testlarni ko'rish", "Browse tests")} <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
