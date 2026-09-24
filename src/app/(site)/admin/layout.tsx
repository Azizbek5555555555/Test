import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, isAdmin, isStaff } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";

const NAV = [
  { href: "/admin", label: "Boshqaruv paneli", icon: "🏠", adminOnly: false },
  { href: "/admin/grading", label: "Tekshirish navbati", icon: "✍️", adminOnly: false },
  { href: "/admin/results", label: "Barcha natijalar", icon: "📊", adminOnly: false },
  { href: "/admin/tests", label: "Testlar", icon: "📝", adminOnly: false },
  { href: "/admin/articles", label: "Maqolalar", icon: "📰", adminOnly: false },
  { href: "/admin/vocabulary", label: "Vocabulary", icon: "📘", adminOnly: false },
  { href: "/admin/courses", label: "Kurslar", icon: "🏫", adminOnly: false },
  { href: "/admin/applications", label: "Kurs arizalari", icon: "📋", adminOnly: false },
  { href: "/admin/messages", label: "Xabarlar", icon: "✉️", adminOnly: false },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: "👥", adminOnly: true },
  { href: "/admin/premium", label: "Premium so'rovlar", icon: "⭐", adminOnly: true },
  { href: "/admin/settings", label: "Sayt sozlamalari", icon: "⚙️", adminOnly: true },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (!profile) redirect(`/login?next=${encodeURIComponent("/admin")}`);
  if (!isStaff(profile)) redirect("/");

  const admin = isAdmin(profile);
  const items = NAV.filter((item) => !item.adminOnly || admin);

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Admin panel</h1>
          <p className="text-sm text-muted mt-0.5">
            {profile.full_name ?? profile.email}
          </p>
        </div>
        <Badge tone={admin ? "brand" : "info"}>
          {admin ? "🛠️ Administrator" : "👩‍🏫 O'qituvchi"}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
        <nav className="card p-2 lg:sticky lg:top-24">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {items.map((item) => (
              <li key={item.href} className="shrink-0 lg:shrink">
                <Link
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold
                             text-muted hover:text-fg hover:bg-[var(--bg-subtle)] transition-colors
                             whitespace-nowrap"
                >
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
