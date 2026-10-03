import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

/** Har bir javobga qo'shiladigan xavfsizlik sarlavhalari (CSP — proxy.ts da, har so'rovga alohida) */
const securityHeaders = [
  // Brauzer saytni 2 yil davomida faqat HTTPS orqali ochadi
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Fayl turini "taxmin qilish"ni taqiqlaydi (masalan, rasmni skript deb bajarish)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Saytni boshqa saytlar <iframe> ichiga qo'ya olmaydi (clickjacking himoyasi)
  { key: "X-Frame-Options", value: "DENY" },
  // Boshqa saytlarga to'liq manzil (token, parametrlar) yuborilmaydi
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Brauzer imkoniyatlari: mikrofon faqat o'zimizga (Speaking), qolganlari yopiq
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // "X-Powered-By: Next.js" sarlavhasi yuborilmaydi (texnologiyani oshkor qilmaslik)
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : [{ protocol: "https" as const, hostname: "*.supabase.co" }]),
    ],
  },
};

export default nextConfig;
