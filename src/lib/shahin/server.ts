import "server-only";
import { randomUUID } from "node:crypto";

type InquiryResult =
  | { status: "valid"; ownerName: string; kind: "card" | "iban" }
  | { status: "not_found" | "invalid_format" };

type TokenCache = { value: string; expiresAt: number; accounts: string[] };
let tokenCache: TokenCache | null = null;

class ShahinError extends Error {}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ShahinError("missing configuration");
  return value;
}

function requireHttpsUrl(name: string) {
  const raw = requiredEnv(name);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ShahinError("invalid configuration");
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new ShahinError("invalid configuration");
  }
  return url;
}

async function readJson(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    throw new ShahinError("invalid upstream response");
  }
}

async function accessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.value;
  }

  const tokenUrl = requireHttpsUrl("SHAHIN_TOKEN_URL");
  tokenUrl.searchParams.set("grant_type", "client_credentials");
  tokenUrl.searchParams.set("bank", requiredEnv("SHAHIN_BANK"));

  const credentials = Buffer.from(
    `${requiredEnv("SHAHIN_CLIENT_ID")}:${requiredEnv("SHAHIN_CLIENT_SECRET")}`
  ).toString("base64");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const body = await readJson(response);
  const token = body.access_token;
  const expiresIn = Number(body.expires_in);
  if (!response.ok || typeof token !== "string" || !token || !Number.isFinite(expiresIn)) {
    throw new ShahinError("token request failed");
  }

  tokenCache = {
    value: token,
    expiresAt: Date.now() + Math.max(60, expiresIn) * 1000,
    accounts: Array.isArray(body.accounts)
      ? body.accounts.filter((a): a is string => typeof a === "string")
      : [],
  };
  return token;
}

async function callShahin(path: string, payload: Record<string, string>) {
  const apiBase = requireHttpsUrl("SHAHIN_API_BASE_URL");
  apiBase.pathname = `${apiBase.pathname.replace(/\/$/, "")}/${path}`;
  const token = await accessToken();
  const signature = requiredEnv("SHAHIN_OBH_SIGNATURE");

  const response = await fetch(apiBase, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Obh-signature": signature,
      "X-Obh-uuid": randomUUID(),
      "X-Obh-timestamp": Date.now().toString(),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const body = await readJson(response);
  if (!response.ok || body.transactionState !== "SUCCESS") {
    throw new ShahinError("inquiry request failed");
  }
  return body.respObject && typeof body.respObject === "object"
    ? (body.respObject as Record<string, unknown>)
    : {};
}

export async function inquireShahinAccount(destination: string): Promise<InquiryResult> {
  const normalized = destination.replace(/[\s-]/g, "").toUpperCase();
  const isCard = /^\d{16}$/.test(normalized);
  const isIban = /^IR\d{24}$/.test(normalized);
  if (!isCard && !isIban) return { status: "invalid_format" };

  const bank = requiredEnv("SHAHIN_BANK");
  const nationalCode = requiredEnv("SHAHIN_NATIONAL_CODE");
  let result: Record<string, unknown>;

  if (isCard) {
    result = await callShahin("card/get-card-info", {
      bank,
      nationalCode,
      sourceAccount: requiredEnv("SHAHIN_AUTHORIZED_SOURCE_ACCOUNT"),
      cardNumber: normalized,
    });
    const ownerName = typeof result.ownerName === "string" ? result.ownerName.trim() : "";
    if (!ownerName) return { status: "not_found" };
    return { status: "valid", ownerName, kind: "card" };
  }

  result = await callShahin("aisp/get-iban-info", {
    bank,
    nationalCode,
    sourceAccount: normalized,
  });
  const returnedIban = typeof result.ibanNumber === "string"
    ? result.ibanNumber.replace(/[\s-]/g, "").toUpperCase()
    : "";
  if (returnedIban !== normalized) return { status: "not_found" };

  const accountStatus = typeof result.accountStatus === "string"
    ? result.accountStatus.toUpperCase()
    : "UNKNOWN";
  if (accountStatus !== "ACTIVE" && accountStatus !== "BLOCKEDWITHDEPOSITABILITY") {
    return { status: "not_found" };
  }

  const ownerName = [result.firstName, result.lastName]
    .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
    .join(" ");
  return {
    status: "valid",
    ownerName: ownerName || "نام صاحب حساب در پاسخ سرویس نبود",
    kind: "iban",
  };
}

export type AccountReadAction = "list" | "info" | "balance" | "statement";

export type AccountReadInput = {
  action: AccountReadAction;
  sourceAccount?: string;
  fromDate?: string;
  toDate?: string;
  fromTime?: string;
  toTime?: string;
};

export class ShahinInputError extends Error {}

const ACCOUNT_PATHS: Record<AccountReadAction, string> = {
  list: "aisp/get-account-list",
  info: "aisp/get-account-info",
  balance: "aisp/get-account-balance",
  statement: "aisp/get-account-statement",
};

function normalizeAccount(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

function optionalDigits(value: string | undefined, length: number, name: string) {
  if (value === undefined || value === "") return undefined;
  if (!new RegExp(`^\\d{${length}}$`).test(value)) {
    throw new ShahinInputError(`invalid ${name}`);
  }
  return value;
}

/** Read-only account services. sourceAccount must be one of the accounts granted to the app token. */
export async function readShahinAccountData(input: AccountReadInput) {
  const path = ACCOUNT_PATHS[input.action];
  if (!path) throw new ShahinInputError("invalid action");

  await accessToken();
  const allowed = (tokenCache?.accounts ?? []).map(normalizeAccount);
  if (allowed.length === 0) {
    throw new ShahinError("token has no authorized accounts");
  }
  const fallback = process.env.SHAHIN_AUTHORIZED_SOURCE_ACCOUNT?.trim();
  const sourceAccount = normalizeAccount(input.sourceAccount || fallback || allowed[0] || "");
  if (!sourceAccount) throw new ShahinInputError("sourceAccount required");
  if (!allowed.includes(sourceAccount)) {
    throw new ShahinInputError("account not authorized");
  }

  const payload: Record<string, string> = {
    bank: requiredEnv("SHAHIN_BANK"),
    nationalCode: requiredEnv("SHAHIN_NATIONAL_CODE"),
    sourceAccount,
  };

  if (input.action === "statement") {
    const fromDate = optionalDigits(input.fromDate, 8, "fromDate");
    const toDate = optionalDigits(input.toDate, 8, "toDate");
    const fromTime = optionalDigits(input.fromTime, 6, "fromTime");
    const toTime = optionalDigits(input.toTime, 6, "toTime");
    if (fromDate) payload.fromDate = fromDate;
    if (toDate) payload.toDate = toDate;
    if (fromDate && fromTime) payload.fromTime = fromTime;
    if (toDate && toTime) payload.toTime = toTime;
  }

  return callShahin(path, payload);
}

export function clearShahinTokenCache() {
  tokenCache = null;
}
