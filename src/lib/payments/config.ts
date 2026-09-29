import "server-only";

/**
 * Onlayn to'lov sozlamalari (Railway → Variables).
 *
 * Kalitlar faqat serverda o'qiladi. Kalit kiritilmagan tizim saytda
 * ko'rinmaydi — shuning uchun Payme va Click'ni alohida-alohida yoqish mumkin.
 */

export type PaymentProvider = "payme" | "click";

export interface PaymeConfig {
  merchantId: string;
  key: string;
  testMode: boolean;
}

export interface ClickConfig {
  serviceId: string;
  merchantId: string;
  secretKey: string;
  merchantUserId: string | null;
}

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getPaymeConfig(): PaymeConfig | null {
  const merchantId = env("PAYME_MERCHANT_ID");
  const key = env("PAYME_KEY");
  if (!merchantId || !key) return null;
  return {
    merchantId,
    key,
    testMode: /^(1|true|on|yes)$/i.test(env("PAYME_TEST_MODE") ?? ""),
  };
}

export function getClickConfig(): ClickConfig | null {
  const serviceId = env("CLICK_SERVICE_ID");
  const merchantId = env("CLICK_MERCHANT_ID");
  const secretKey = env("CLICK_SECRET_KEY");
  if (!serviceId || !merchantId || !secretKey) return null;
  return { serviceId, merchantId, secretKey, merchantUserId: env("CLICK_MERCHANT_USER_ID") };
}

export function getEnabledProviders(): PaymentProvider[] {
  const list: PaymentProvider[] = [];
  if (getPaymeConfig()) list.push("payme");
  if (getClickConfig()) list.push("click");
  return list;
}

/**
 * Payme to'lov sahifasi havolasi.
 * Format: base64("m=<merchant>;ac.order_id=<raqam>;a=<tiyin>;c=<qaytish>;l=uz")
 */
export function paymeCheckoutUrl(
  config: PaymeConfig,
  orderNumber: number | string,
  amountSom: number,
  returnUrl: string,
): string {
  const params = [
    `m=${config.merchantId}`,
    `ac.order_id=${orderNumber}`,
    `a=${Math.round(amountSom * 100)}`,
    `c=${returnUrl}`,
    "l=uz",
  ].join(";");
  const base = config.testMode
    ? "https://checkout.test.paycom.uz"
    : "https://checkout.paycom.uz";
  return `${base}/${Buffer.from(params, "utf8").toString("base64")}`;
}

/** Click to'lov sahifasi havolasi */
export function clickCheckoutUrl(
  config: ClickConfig,
  orderNumber: number | string,
  amountSom: number,
  returnUrl: string,
): string {
  const query = new URLSearchParams({
    service_id: config.serviceId,
    merchant_id: config.merchantId,
    amount: String(amountSom),
    transaction_param: String(orderNumber),
    return_url: returnUrl,
  });
  if (config.merchantUserId) query.set("merchant_user_id", config.merchantUserId);
  return `https://my.click.uz/services/pay?${query.toString()}`;
}
