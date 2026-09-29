import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Search } from "react-feather";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { PageHeader, EmptyState } from "@/components/ui/Card";
import { AccessBadge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Qidiruv",
  robots: { index: false, follow: true },
};

interface TestHit {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  is_premium: boolean;
}

interface ArticleHit {
  slug: string;
  title: string;
  excerpt: string | null;
  level: string | null;
  is_premium: boolean;
}

/** Test va maqolalar bo'yicha oddiy qidiruv (sarlavha va tavsif) */
async function searchAll(q: string): Promise<{ tests: TestHit[]; articles: ArticleHit[] }> {
  if (!isSupabaseConfigured() || q.length < 2) return { tests: [], articles: [] };
  // PostgREST "or" filtri uchun maxsus belgilarni olib tashlaymiz
  const term = q.replace(/[%,().*]/g, " ").trim().slice(0, 60);
  if (term.length < 2) return { tests: [], articles: [] };
  try {
    const supabase = await createServerSupabase();
    const [tests, articles] = await Promise.all([
      supabase
        .from("test_sets")
        .select("slug, title, description, category, is_premium")
        .eq("published", true)
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        .order("order_index")
        .limit(20),
      supabase
        .from("articles")
        .select("slug, title, excerpt, level, is_premium")
        .eq("published", true)
        .or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`)
        .limit(20),
    ]);
    return {
      tests: (tests.data ?? []) as TestHit[],
      articles: (articles.data ?? []) as ArticleHit[],
    };
  } catch {
    return { tests: [], articles: [] };
  }
}

function testHref(hit: TestHit): string {
  return hit.category === "exam_checking" ? `/exam-checking/${hit.slug}` : `/tests/${hit.slug}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const { tests, articles } = await searchAll(query);
  const total = tests.length + articles.length;

  return (
    <div className="container-page py-14">
      <PageHeader eyebrow="Qidiruv" title={query ? `“${query}”` : "Nimani qidiramiz?"} />

      <form
        action="/search"
        role="search"
        className="mb-12 flex items-center gap-4 rounded-full border border-line bg-surface px-6 py-4 focus-within:border-brand-400"
      >
        <Search size={20} strokeWidth={1.75} className="shrink-0 text-faint" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Mock testlar, maqolalar yoki mavzularni qidiring…"
          className="min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-faint focus:outline-none"
          aria-label="Qidirish"
        />
      </form>

      {query && total === 0 ? (
        <EmptyState
          icon="🔍"
          title="Hech narsa topilmadi"
          description="Boshqa so'z bilan qidirib ko'ring: masalan “Full Mock”, “Listening” yoki maqola mavzusi."
        />
      ) : null}

      {tests.length > 0 ? (
        <section className="mb-12">
          <h2 className="display-title mb-5 text-3xl">Testlar</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {tests.map((hit) => (
              <Link key={hit.slug} href={testHref(hit)} className="card group flex items-start gap-4 p-5 lift">
                <FileText size={22} strokeWidth={1.75} className="mt-1 shrink-0 text-brand-400" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="display-title text-xl">{hit.title}</h3>
                    <AccessBadge isPremium={hit.is_premium} />
                  </div>
                  {hit.description ? (
                    <p className="mt-1 text-sm text-muted line-clamp-2">{hit.description}</p>
                  ) : null}
                </div>
                <ArrowRight size={16} className="mt-2 shrink-0 text-faint transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {articles.length > 0 ? (
        <section>
          <h2 className="display-title mb-5 text-3xl">Maqolalar</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {articles.map((hit) => (
              <Link key={hit.slug} href={`/boost/articles/${hit.slug}`} className="card group p-5 lift">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="display-title text-xl">{hit.title}</h3>
                  {hit.level ? (
                    <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-muted">
                      {hit.level}
                    </span>
                  ) : null}
                </div>
                {hit.excerpt ? <p className="mt-2 text-sm text-muted line-clamp-2">{hit.excerpt}</p> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
