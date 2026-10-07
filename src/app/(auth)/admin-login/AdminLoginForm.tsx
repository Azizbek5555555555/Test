"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock, User } from "react-feather";
import { staffSignInAction } from "@/lib/actions/staff";
import type { ActionResult } from "@/lib/actions/profile";
import { Alert } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/** Admin panelga login + parol bilan kirish formasi */
export function AdminLoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(staffSignInAction, null);
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-muted">Login</span>
        <span className="al-field">
          <User size={16} aria-hidden />
          <input
            name="login"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="masalan: admin"
            className="al-input"
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-muted">Parol</span>
        <span className="al-field">
          <Lock size={16} aria-hidden />
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="al-input"
          />
          <button
            type="button"
            className="al-eye"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Parolni yashirish" : "Parolni ko'rsatish"}
          >
            {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </span>
      </label>

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Tekshirilmoqda…" : "Kirish"}
      </Button>
    </form>
  );
}
