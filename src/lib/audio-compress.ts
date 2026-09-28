/**
 * Katta audio faylni brauzerning o'zida kichraytirish (MP3, mono, 24 kHz).
 *
 * Nega kerak: Supabase bepul tarifida bitta fayl 50 MB dan oshmasligi kerak,
 * mock testlarning audiolari esa 50–100 MB. Nutq (Listening) uchun
 * 56 kbps mono sifati yetarli — 45 daqiqalik audio ~19 MB bo'ladi va
 * o'quvchilarda ham tezroq yuklanadi.
 *
 * Faqat brauzerda ishlaydi (Web Audio API + lamejs).
 */

export const COMPRESS_SAMPLE_RATE = 24000;
export const COMPRESS_KBPS = 56;
/** Shundan kichik MP3 fayllar o'zgartirilmasdan yuklanadi */
export const COMPRESS_THRESHOLD_BYTES = 25 * 1024 * 1024;

export function needsCompression(file: File): boolean {
  const isMp3 = file.type === "audio/mpeg" || /\.mp3$/i.test(file.name);
  return !isMp3 || file.size > COMPRESS_THRESHOLD_BYTES;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * @param onProgress 0..1 — foizni ko'rsatish uchun
 */
export async function compressAudio(
  file: File,
  onProgress: (fraction: number, stage: "decode" | "encode") => void,
): Promise<Blob> {
  onProgress(0, "decode");
  const { Mp3Encoder } = await import("@breezystack/lamejs");

  // decodeAudioData audioni konteksning chastotasiga (24 kHz) o'tkazib beradi
  const context = new OfflineAudioContext(1, 1, COMPRESS_SAMPLE_RATE);
  let decoded: AudioBuffer | null = await context.decodeAudioData(
    await file.arrayBuffer(),
  );

  // Stereo → mono, Float32 → Int16
  const length = decoded.length;
  const channels = Array.from({ length: decoded.numberOfChannels }, (_, c) =>
    decoded!.getChannelData(c),
  );
  const mono = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (const channel of channels) sum += channel[i];
    const sample = Math.max(-1, Math.min(1, sum / channels.length));
    mono[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  decoded = null; // xotirani bo'shatish
  channels.length = 0;

  const encoder = new Mp3Encoder(1, COMPRESS_SAMPLE_RATE, COMPRESS_KBPS);
  const parts: BlobPart[] = [];
  const block = 1152 * 40;
  let step = 0;
  for (let offset = 0; offset < length; offset += block) {
    const chunk = encoder.encodeBuffer(mono.subarray(offset, offset + block));
    if (chunk.length > 0) parts.push(new Uint8Array(chunk));
    if (++step % 25 === 0) {
      onProgress(offset / length, "encode");
      await nextFrame(); // sahifa qotib qolmasligi uchun
    }
  }
  const tail = encoder.flush();
  if (tail.length > 0) parts.push(new Uint8Array(tail));
  onProgress(1, "encode");

  return new Blob(parts, { type: "audio/mpeg" });
}

export function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
