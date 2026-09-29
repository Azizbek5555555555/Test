import { BookOpen, Edit3, Headphones, Mic, type Icon } from "react-feather";
import type { SkillSection } from "@/lib/types";

/** Feather to'plamida yo'q qo'shimcha ikonlar (bir xil uslubda: 1.5 chiziq) */
export function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

const SECTION_ICONS: Record<SkillSection, Icon> = {
  reading: BookOpen,
  listening: Headphones,
  writing: Edit3,
  speaking: Mic,
};

/** Bo'lim ikonasi (Figma: Feather to'plami) */
export function SectionIcon({
  section,
  size = 18,
  className,
}: {
  section: SkillSection;
  size?: number;
  className?: string;
}) {
  const Cmp = SECTION_ICONS[section];
  return <Cmp size={size} strokeWidth={1.75} className={className} aria-hidden />;
}
