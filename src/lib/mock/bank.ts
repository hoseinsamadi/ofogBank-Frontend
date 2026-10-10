export type BankAccountStatus =
  | "valid"
  | "not_found"
  | "invalid_format"
  | "unavailable";

export type AccountInquiry =
  | { status: "valid"; ownerName: string; kind: "card" | "iban" }
  | { status: "not_found" | "invalid_format" | "unavailable" };

export function normalizeDestination(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

function destinationKind(value: string): "card" | "iban" | null {
  if (/^\d{16}$/.test(value)) return "card";
  if (/^IR\d{24}$/.test(value)) return "iban";
  return null;
}

/** استعلام سمت سرور؛ اطلاعات ورود شاهین هرگز به مرورگر فرستاده نمی‌شود. */
export async function inquireAccountOwner(
  destination: string
): Promise<AccountInquiry> {
  const normalized = normalizeDestination(destination);
  const kind = destinationKind(normalized);
  if (!kind) return { status: "invalid_format" };

  try {
    const response = await fetch("/api/shahin/account-inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: normalized }),
    });
    const result = (await response.json()) as AccountInquiry;
    if (!response.ok || !result || typeof result.status !== "string") {
      return { status: "unavailable" };
    }
    return result;
  } catch {
    return { status: "unavailable" };
  }
}

export async function checkBankAccount(
  destination: string
): Promise<BankAccountStatus> {
  return (await inquireAccountOwner(destination)).status;
}

export function bankStatusMessage(status: BankAccountStatus) {
  switch (status) {
    case "valid":
      return "حساب مقصد در شاهین تأیید شد";
    case "not_found":
      return "حساب مقصد فعال یا قابل استفاده نیست";
    case "invalid_format":
      return "فرمت شماره حساب مقصد نامعتبر است";
    case "unavailable":
      return "استعلام شاهین انجام نشد؛ تنظیمات یا دسترسی Sandbox را بررسی کنید";
  }
}
