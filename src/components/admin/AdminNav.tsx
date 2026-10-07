"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckSquare,
  Briefcase,
  Clipboard,
  CreditCard,
  FileText,
  Grid,
  Home,
  Key,
  Mail,
  Settings,
  Star,
  Users,
  type Icon,
} from "react-feather";
import { cn } from "@/lib/format";

export type NavIcon =
  | "home"
  | "grading"
  | "results"
  | "tests"
  | "articles"
  | "vocab"
  | "courses"
  | "applications"
  | "messages"
  | "users"
  | "staff"
  | "payments"
  | "premium"
  | "settings";

const ICONS: Record<NavIcon, Icon> = {
  home: Home,
  grading: CheckSquare,
  results: Award,
  tests: FileText,
  articles: BookOpen,
  vocab: Grid,
  courses: Briefcase,
  applications: Clipboard,
  messages: Mail,
  users: Users,
  staff: Key,
  payments: CreditCard,
  premium: Star,
  settings: Settings,
};

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  badge?: number;
  group: string;
}

/** Chap panel: doira ichidagi ikonkalar (Payno uslubi), faol bo'lim — shaftoli rangda */
export function AdminNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <nav className="adm-rail" aria-label="Admin bo'limlari">
      {groups.map((g) => (
        <div key={g} className="adm-rail-group">
          <p className="adm-rail-title">{g}</p>
          <ul>
            {items
              .filter((i) => i.group === g)
              .map((item) => {
                const Icon = ICONS[item.icon];
                const active = item.href === "/admin" ? path === "/admin" : path.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link href={item.href} className={cn("adm-rail-link", active && "is-active")} aria-current={active ? "page" : undefined}>
                      <span className="adm-rail-icon">
                        <Icon size={17} strokeWidth={1.7} />
                        {item.badge ? <em>{item.badge > 99 ? "99+" : item.badge}</em> : null}
                      </span>
                      <span className="adm-rail-label">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
