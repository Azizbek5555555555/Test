// Admin panel — alohida ilova ko'rinishi (sayt header/footer'isiz).
// Sahifalar foydalanuvchiga bog'liq, shuning uchun har so'rovda serverda render qilinadi.
export const dynamic = "force-dynamic";

export default function AdminGroupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
