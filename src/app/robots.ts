import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

/** Qidiruv tizimlari uchun: shaxsiy va xizmat sahifalari indekslanmaydi */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/profile", "/results/", "/test/", "/exam/", "/onboarding", "/premium/checkout/", "/setup-check"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
