import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, isAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { emailToLogin, isStaffLoginEmail } from "@/lib/staff-login";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { CreateStaffForm, StaffRowActions } from "@/components/admin/StaffActions";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = {
  title: "Xodimlar va parollar",
  robots: { index: false, follow: false },
};

async function listStaff(): Promise<Profile[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "teacher"])
    .order("created_at", { ascending: true });
  return (data ?? []) as Profile[];
}

/** Admin va o'qituvchilar: login + parol bilan kiradigan akkauntlar */
export default async function AdminStaffPage() {
  const me = await getProfile();
  if (!isAdmin(me)) redirect("/admin");
  const staff = await listStaff();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold">Xodimlar va parollar</h2>
        <p className="mt-0.5 text-sm text-muted">
          Admin panelga <b className="text-fg">levelx.academy/admin-login</b> sahifasidan login va parol bilan kiriladi.
        </p>
      </div>

      <section className="card p-5">
        <h3 className="font-bold">Yangi xodim akkaunti</h3>
        <p className="mb-4 mt-1 text-xs text-muted">
          Login va parolni xodimga o&apos;zingiz yuborasiz. O&apos;qituvchi faqat tekshirish va natijalarni ko&apos;radi;
          administrator — butun panelni.
        </p>
        <CreateStaffForm />
      </section>

      <section className="space-y-2">
        <h3 className="font-bold">
          Xodimlar <span className="tabular-nums text-muted">({staff.length})</span>
        </h3>
        {staff.map((user) => {
          const loginAccount = isStaffLoginEmail(user.email);
          return (
            <div key={user.id} className="card flex flex-wrap items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{user.full_name ?? "Ismsiz"}</p>
                  <Badge tone={user.role === "admin" ? "brand" : "info"}>{user.role === "admin" ? "Admin" : "O'qituvchi"}</Badge>
                  {user.id === me?.id ? <Badge tone="neutral">Siz</Badge> : null}
                </div>
                <p className="mt-1 text-sm">
                  <span className="text-muted">Login: </span>
                  <b className="font-mono">{emailToLogin(user.email)}</b>
                  {!loginAccount ? <span className="ml-2 text-xs text-muted">(Google / e-mail akkaunt)</span> : null}
                </p>
                <p className="mt-0.5 text-xs text-muted">Qo&apos;shilgan: {formatDate(user.created_at)}</p>
              </div>
              <StaffRowActions userId={user.id} canDelete={loginAccount && user.id !== me?.id} />
            </div>
          );
        })}
      </section>
    </div>
  );
}
