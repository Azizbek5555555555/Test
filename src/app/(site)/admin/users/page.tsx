import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, isAdmin, profileHasPremium } from "@/lib/auth";
import { listProfiles } from "@/lib/admin-queries";
import { formatDate, formatXp } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { PremiumControl, RoleControl } from "@/components/admin/UserActions";

export const metadata: Metadata = {
  title: "Foydalanuvchilar",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await getProfile();
  if (!isAdmin(me)) redirect("/admin");

  const { q } = await searchParams;
  const users = await listProfiles(q);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold">Foydalanuvchilar</h2>
          <p className="text-sm text-muted mt-0.5">
            Premium berish va rollarni boshqarish
          </p>
        </div>

        <form className="flex items-center gap-2" action="/admin/users">
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Ism yoki email bo'yicha qidirish…"
            className="w-64"
          />
          <Button type="submit" variant="secondary">
            Qidirish
          </Button>
        </form>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Foydalanuvchi topilmadi"
          description={
            q
              ? "Qidiruvni o'zgartirib ko'ring."
              : "Hali hech kim ro'yxatdan o'tmagan."
          }
        />
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const premium = profileHasPremium(user);
            return (
              <div key={user.id} className="card p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <Avatar
                    name={user.full_name}
                    src={user.avatar_url}
                    size="md"
                    ring={user.is_premium}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold truncate">
                        {user.full_name ?? "Ismsiz"}
                      </p>
                      {user.is_premium ? (
                        <Badge tone={premium ? "premium" : "warning"}>
                          {premium ? "⭐ PREMIUM" : "⏳ Muddati tugagan"}
                        </Badge>
                      ) : (
                        <Badge tone="neutral">FREE</Badge>
                      )}
                      {user.role !== "student" ? (
                        <Badge tone="brand">
                          {user.role === "admin" ? "Admin" : "O'qituvchi"}
                        </Badge>
                      ) : null}
                      {user.id === me?.id ? (
                        <Badge tone="info">Siz</Badge>
                      ) : null}
                    </div>

                    <p className="text-sm text-muted truncate mt-0.5">
                      {user.email}
                    </p>

                    <p className="text-xs text-muted mt-1">
                      {formatXp(user.total_xp)} XP · Ro&apos;yxatdan:{" "}
                      {formatDate(user.created_at)}
                      {user.premium_until
                        ? ` · Premium: ${formatDate(user.premium_until)}`
                        : ""}
                      {user.phone ? ` · ${user.phone}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-5">
                    <PremiumControl
                      userId={user.id}
                      isPremium={user.is_premium}
                    />
                    <RoleControl userId={user.id} role={user.role} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
