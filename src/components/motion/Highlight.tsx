/** Matn ichidagi bitta so'zni ajratadi: rangli kursiv + tagiga qo'lda chizilgan chiziq (CSS: .hero-em) */
export function Highlight({ text, word }: { text: string; word?: string }) {
  const at = word ? text.indexOf(word) : -1;
  if (!word || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <em className="hero-em">
        {word}
        <svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden>
          <path d="M4 16 C 60 6, 130 20, 190 10 S 280 8, 296 14" pathLength={1} />
        </svg>
      </em>
      {text.slice(at + word.length)}
    </>
  );
}
