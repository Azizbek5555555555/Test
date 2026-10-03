import { HONEYPOT_FIELD } from "@/lib/rate-limit-shared";

/**
 * Bot-tuzoq: odam ko'rmaydigan va to'ldirmaydigan maydon (ekrandan tashqarida).
 * Botlar formadagi hamma maydonni to'ldiradi — server shundan bot ekanini biladi.
 */
export function Honeypot() {
  return (
    <div className="lx-hp" aria-hidden="true">
      <label>
        Website
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
