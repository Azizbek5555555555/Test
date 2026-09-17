"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions/profile";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Card";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "json"
  | "hidden";

export interface AdminField {
  name: string;
  label: string;
  type: FieldType;
  defaultValue?: string | number | boolean | null;
  options?: { value: string; label: string }[];
  hint?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  /** Ikki ustunli tarmoqda kengligi */
  full?: boolean;
}

export type AdminAction = (
  prev: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

/**
 * Admin panel uchun universal forma.
 * Maydonlar ro'yxati (`fields`) asosida formani o'zi quradi.
 */
export function AdminForm({
  action,
  fields,
  submitLabel = "Saqlash",
  resetOnSuccess,
  compact,
}: {
  action: AdminAction;
  fields: AdminField[];
  submitLabel?: string;
  resetOnSuccess?: boolean;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  const key = resetOnSuccess && state?.ok ? "reset" : "form";

  return (
    <form action={formAction} key={key} className="space-y-4">
      {state ? (
        <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>
      ) : null}

      <div className={compact ? "space-y-4" : "grid sm:grid-cols-2 gap-4"}>
        {fields.map((field) => {
          if (field.type === "hidden") {
            return (
              <input
                key={field.name}
                type="hidden"
                name={field.name}
                value={String(field.defaultValue ?? "")}
              />
            );
          }

          const id = `f-${field.name}`;
          const wrapperClass =
            !compact && (field.full || field.type === "textarea" || field.type === "json")
              ? "sm:col-span-2"
              : undefined;

          return (
            <div key={field.name} className={wrapperClass}>
              {field.type === "checkbox" ? (
                <label className="flex items-center gap-2.5 cursor-pointer pt-6">
                  <input
                    type="checkbox"
                    name={field.name}
                    defaultChecked={Boolean(field.defaultValue)}
                    className="w-4 h-4 rounded accent-[var(--color-brand-600)]"
                  />
                  <span className="text-sm font-semibold">{field.label}</span>
                </label>
              ) : (
                <Field
                  label={field.label}
                  htmlFor={id}
                  required={field.required}
                  hint={field.hint}
                >
                  {field.type === "textarea" || field.type === "json" ? (
                    <Textarea
                      id={id}
                      name={field.name}
                      defaultValue={String(field.defaultValue ?? "")}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={field.rows ?? (field.type === "json" ? 4 : 6)}
                      className={
                        field.type === "json"
                          ? "font-mono text-xs leading-relaxed"
                          : undefined
                      }
                      spellCheck={field.type !== "json"}
                    />
                  ) : field.type === "select" ? (
                    <Select
                      id={id}
                      name={field.name}
                      defaultValue={String(field.defaultValue ?? "")}
                      required={field.required}
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id={id}
                      name={field.name}
                      type={field.type === "number" ? "number" : "text"}
                      defaultValue={String(field.defaultValue ?? "")}
                      placeholder={field.placeholder}
                      required={field.required}
                      step={field.type === "number" ? "any" : undefined}
                    />
                  )}
                </Field>
              )}
            </div>
          );
        })}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saqlanmoqda…" : submitLabel}
      </Button>
    </form>
  );
}
