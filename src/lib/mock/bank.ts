export type BankAccountStatus = "valid" | "not_found" | "invalid_format";

/**
 * نسخه آزمایشی: فهرست حساب‌های موجود در بانک.
 * در نسخه واقعی این داده از API بانک خوانده می‌شود.
 */
const BANK_ACCOUNTS = new Map<string, string>([
  ["6037997512345678", "علی رضایی"],
  ["6104337812345678", "مریم احمدی"],
  ["6219861012345678", "حسین کریمی"],
  ["5022291012345678", "زهرا محمدی"],
  ["6274129012345678", "رضا موسوی"],
  ["IR620570028180010203040506", "سارا حسینی"],
  ["IR120170000000123456789012", "امیر نوری"],
  ["IR580170000000123456789012", "نرگس صادقی"],
  ["IR440170000000123456789012", "محمد جعفری"],
]);

const CARD_PATTERN = /^\d{16}$/;
const IBAN_PATTERN = /^IR\d{24}$/i;

export function normalizeDestination(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export function isBankAccountExists(destination: string) {
  return BANK_ACCOUNTS.has(normalizeDestination(destination));
}

export type AccountInquiry =
  | { status: "valid"; ownerName: string; kind: "card" | "iban" }
  | { status: "not_found" | "invalid_format" };

/** استعلام نام صاحب حساب با شماره کارت یا شبا (آزمایشی). */
export async function inquireAccountOwner(
  destination: string
): Promise<AccountInquiry> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const normalized = normalizeDestination(destination);
  const isCard = CARD_PATTERN.test(normalized);
  if (!isCard && !IBAN_PATTERN.test(normalized)) {
    return { status: "invalid_format" };
  }
  const ownerName = BANK_ACCOUNTS.get(normalized);
  if (!ownerName) return { status: "not_found" };
  return { status: "valid", ownerName, kind: isCard ? "card" : "iban" };
}

/**
 * بررسی شماره حساب مقصد در بانک.
 * شبیه‌سازی تأخیر تماس بانکی برای نمایش وضعیت «در حال بررسی».
 */
export async function checkBankAccount(
  destination: string
): Promise<BankAccountStatus> {
  await new Promise((resolve) => setTimeout(resolve, 180));

  const normalized = normalizeDestination(destination);
  if (!CARD_PATTERN.test(normalized) && !IBAN_PATTERN.test(normalized)) {
    return "invalid_format";
  }

  return isBankAccountExists(normalized) ? "valid" : "not_found";
}

export function bankStatusMessage(status: BankAccountStatus) {
  switch (status) {
    case "valid":
      return "حساب مقصد موجود است";
    case "not_found":
      return "این شماره حساب موجود نیست";
    case "invalid_format":
      return "فرمت شماره حساب مقصد نامعتبر است";
  }
}
