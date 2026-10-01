import type { MetadataRoute } from "next";
import { COURSES_ENABLED, SITE_URL } from "@/lib/constants";

/** Ochiq sahifalar xaritasi (Google va boshqa qidiruv tizimlari uchun) */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ["/", 1],
    ["/full-mock", 0.9],
    ["/latest-questions", 0.9],
    ["/exam-checking", 0.9],
    ["/premium", 0.8],
    ["/boost", 0.8],
    ["/boost/articles", 0.7],
    ["/boost/listening", 0.7],
    ["/vocabulary-battle", 0.7],
    ["/leaderboard", 0.5],
    ...(COURSES_ENABLED ? ([["/courses", 0.7]] as [string, number][]) : []),
    ["/contact", 0.5],
    ["/privacy", 0.2],
    ["/terms", 0.2],
  ];
  const now = new Date();
  return pages.map(([path, priority]) => ({ url: `${SITE_URL}${path}`, lastModified: now, priority }));
}
