import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, ExternalLink } from "react-feather";
import { getProfile, isAdmin, isStaff } from "@/lib/auth";
import { getAdminCounts } from "@/lib/admin-queries";
import { COURSES_ENABLED } from "@/lib/constants";
import { initials } from "@/lib/format";
import { BrandMark } from "@/components/layout/BrandLogo";
import { AdminNav, type NavItem } from "@/components/admin/AdminNav";

/**
 * Admin panel qobig'i (Payno uslubi, sayt ranglarida): katta shisha ramka,
 * tepada rangli nur, chapda doira ikonkali panel, o'ngda kontent.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  if (!profile) redirect(`/login?next=${encodeURIComponent("/admin")}`);
  if (!isStaff(profile)) redirect("/");

  const admin = isAdmin(profile);
  const counts = await getAdminCounts();
  const pending = counts.pendingChecks + (admin ? counts.pendingPremium : 0) + counts.unreadMessages + counts.newApplications;

  const items: NavItem[] = [
    { href: "/admin", label: "Boshqaruv paneli", icon: "home", group: "Asosiy" },
    { href: "/admin/grading", label: "Tekshirish navbati", icon: "grading", group: "Asosiy", badge: counts.pendingChecks },
    { href: "/admin/results", label: "Barcha natijalar", icon: "results", group: "Asosiy" },
    { href: "/admin/tests", label: "Testlar", icon: "tests", group: "Kontent" },
    { href: "/admin/articles", label: "Maqolalar", icon: "articles", group: "Kontent" },
    { href: "/admin/vocabulary", label: "Vocabulary", icon: "vocab", group: "Kontent" },
    ...(COURSES_ENABLED
      ? ([
          { href: "/admin/courses", label: "Kurslar", icon: "courses", group: "Kontent" },
          { href: "/admin/applications", label: "Kurs arizalari", icon: "applications", group: "Aloqa", badge: counts.newApplications },
        ] as NavItem[])
      : []),
    { href: "/admin/messages", label: "Xabarlar", icon: "messages", group: "Aloqa", badge: counts.unreadMessages },
    ...(admin
      ? ([
          { href: "/admin/users", label: "Foydalanuvchilar", icon: "users", group: "Boshqaruv" },
          { href: "/admin/payments", label: "To'lovlar", icon: "payments", group: "Boshqaruv" },
          { href: "/admin/premium", label: "Premium so'rovlar", icon: "premium", group: "Boshqaruv", badge: counts.pendingPremium },
          { href: "/admin/settings", label: "Sayt sozlamalari", icon: "settings", group: "Boshqaruv" },
        ] as NavItem[])
      : []),
  ];

  const name = profile.full_name ?? profile.email ?? "Admin";

  return (
    <div className="adm">
      <div className="adm-frame">
        <div className="adm-glow" aria-hidden />
        <header className="adm-top">
          <Link href="/admin" className="adm-brand">
            <span className="adm-brand-mark">
              <BrandMark size={30} />
            </span>
            <span className="adm-brand-name">
              level<span className="text-[#10bfa6]">x</span>english <em>Admin</em>
            </span>
          </Link>
          <div className="adm-top-actions">
            <Link href="/" className="adm-circle" title="Saytga qaytish">
              <ExternalLink size={16} strokeWidth={1.8} />
            </Link>
            <Link href={counts.pendingChecks ? "/admin/grading" : "/admin"} className="adm-circle" title={`${pending} ta ish kutilmoqda`}>
              <Bell size={16} strokeWidth={1.8} />
              {pending > 0 ? <i className="adm-dot" /> : null}
            </Link>
            <div className="adm-user">
              <span className="adm-avatar">{initials(name)}</span>
              <span className="adm-user-text">
                <b>{name}</b>
                <small>{admin ? "Administrator" : "O'qituvchi"}</small>
              </span>
            </div>
          </div>
        </header>

        <div className="adm-body">
          <AdminNav items={items} />
          <main className="adm-main">{children}</main>
        </div>
      </div>
    </div>
  );
}
