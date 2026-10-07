"use client";

import { useActionState, useState } from "react";
import { createStaffAccountAction, deleteStaffAccountAction, setStaffPasswordAction } from "@/lib/actions/staff";
import type { ActionResult } from "@/lib/actions/profile";
import { STAFF_PASSWORD_MIN } from "@/lib/staff-login";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";

/** Tasodifiy, eslab qolsa bo'ladigan parol: "Summit-4827-lx" */
function suggestPassword(): string {
  const words = ["Summit", "Peak", "Level", "Climb", "Ridge", "Focus", "Bright", "Steady"];
  const bytes = new Uint32Array(2);
  crypto.getRandomValues(bytes);
  return `${words[bytes[0] % words.length]}-${1000 + (bytes[1] % 9000)}-lx`;
}

function Message({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  return <p className={`text-xs ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</p>;
}

/** Yangi xodim akkaunti: ism, login, parol, rol */
export function CreateStaffForm() {
  // Maydonlar boshqariladi: xato bo'lsa kiritilganlar o'chib ketmaydi, muvaffaqiyatda tozalanadi
  const [fullName, setFullName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(async (prev, formData) => {
    const result = await createStaffAccountAction(prev, formData);
    if (result.ok) {
      setFullName("");
      setLogin("");
      setPassword("");
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-muted">
          Ism-familiya
          <Input
            name="full_name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Masalan: Shokir Abduxalilov"
            className="mt-1"
          />
        </label>
        <label className="block text-xs font-semibold text-muted">
          Login
          <Input
            name="login"
            required
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoCapitalize="none"
            spellCheck={false}
            placeholder="masalan: shokir"
            className="mt-1"
          />
        </label>
        <label className="block text-xs font-semibold text-muted">
          Parol (kamida {STAFF_PASSWORD_MIN} ta belgi, harf va raqam)
          <div className="mt-1 flex gap-2">
            <Input
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="flex-1"
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => setPassword(suggestPassword())}>
              Yaratish
            </Button>
          </div>
        </label>
        <label className="block text-xs font-semibold text-muted">
          Rol
          <Select name="role" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1">
            <option value="teacher">O&apos;qituvchi — tekshirish va natijalar</option>
            <option value="admin">Administrator — hamma narsa</option>
          </Select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Yaratilmoqda…" : "Akkaunt yaratish"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}

/** Xodimga yangi parol berish (va kerak bo'lsa — login akkauntini o'chirish) */
export function StaffRowActions({ userId, canDelete }: { userId: string; canDelete: boolean }) {
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(async (prev, formData) => {
    const result = await setStaffPasswordAction(prev, formData);
    if (result.ok) setPassword("");
    return result;
  }, null);
  const [delState, deleteAction, deleting] = useActionState<ActionResult | null, FormData>(deleteStaffAccountAction, null);

  return (
    <div className="space-y-1.5">
      <form action={formAction} className="flex flex-wrap items-center gap-1.5">
        <input type="hidden" name="user_id" value={userId} />
        <Input
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Yangi parol"
          autoComplete="new-password"
          className="w-40 py-1.5 text-xs"
          aria-label="Yangi parol"
        />
        <Button type="button" size="sm" variant="secondary" onClick={() => setPassword(suggestPassword())}>
          Yaratish
        </Button>
        <Button type="submit" size="sm" disabled={pending || password.length === 0}>
          Parolni saqlash
        </Button>
      </form>
      {canDelete ? (
        <form action={deleteAction}>
          <input type="hidden" name="user_id" value={userId} />
          <ConfirmSubmitButton
            message="Bu xodim akkaunti butunlay o'chiriladi. Davom etasizmi?"
            className="text-xs font-semibold text-danger hover:underline disabled:opacity-50"
          >
            {deleting ? "O'chirilmoqda…" : "Akkauntni o'chirish"}
          </ConfirmSubmitButton>
        </form>
      ) : null}
      <Message state={state} />
      <Message state={delState} />
    </div>
  );
}
