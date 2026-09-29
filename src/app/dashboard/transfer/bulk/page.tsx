"use client";

import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

type TransferRow = { id: string; name: string; destination: string; amount: number };
type HeaderMap = { name?: number; firstName?: number; lastName?: number; destination?: number; card?: number; iban?: number; amount?: number };

const NAME_HEADERS = ["نام و نام خانوادگی", "نام کامل", "نام گیرنده", "name", "fullname", "full name", "recipient"];
const FIRST_NAME_HEADERS = ["نام", "نام کوچک", "firstname", "first name"];
const LAST_NAME_HEADERS = ["نام خانوادگی", "نام فامیلی", "lastname", "last name", "surname"];
const DESTINATION_HEADERS = ["شماره کارت یا شبا", "کارت یا شبا", "شماره مقصد", "destination", "account", "recipient account"];
const CARD_HEADERS = ["شماره کارت", "کارت", "card", "card number"];
const IBAN_HEADERS = ["شماره شبا", "شبا", "iban", "iban number"];
const AMOUNT_HEADERS = ["مبلغ", "مبلغ به ریال", "مبلغ (ریال)", "amount", "amount rial", "rial amount"];

function normalize(value: unknown) {
  return String(value ?? "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[يى]/g, "ی").replace(/[ك]/g, "ک").replace(/[\u200c\s_()\-،,;:/\\]/g, "");
}
function digits(value: unknown) {
  return String(value ?? "").replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}
function cleanDestination(value: unknown) { return digits(value).replace(/[\s-]/g, "").toUpperCase(); }
function parseAmount(value: unknown) {
  const cleaned = digits(value).replace(/[٬,،\s]/g, "").replace(/ریال|ر\.یال/gi, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}
function findHeader(headers: string[], aliases: string[]) {
  const wanted = new Set(aliases.map(normalize));
  const index = headers.findIndex((header) => wanted.has(normalize(header)));
  if (index !== -1) return index;

  const partialIndex = headers.findIndex((header) => {
    const normalizedHeader = normalize(header);
    return aliases.some((alias) => {
      const normalizedAlias = normalize(alias);
      return normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader);
    });
  });
  return partialIndex === -1 ? undefined : partialIndex;
}
function getHeaderMap(rawHeaders: unknown[]): HeaderMap {
  const headers = rawHeaders.map((header) => String(header ?? ""));
  return { name: findHeader(headers, NAME_HEADERS), firstName: findHeader(headers, FIRST_NAME_HEADERS), lastName: findHeader(headers, LAST_NAME_HEADERS), destination: findHeader(headers, DESTINATION_HEADERS), card: findHeader(headers, CARD_HEADERS), iban: findHeader(headers, IBAN_HEADERS), amount: findHeader(headers, AMOUNT_HEADERS) };
}
function valueAt(row: unknown[], index: number | undefined) { return index === undefined || index < 0 ? "" : row[index]; }
function isValidDestination(value: string) { return /^\d{16}$/.test(value) || /^IR\d{24}$/.test(value); }
function formatNumber(value: number) { return new Intl.NumberFormat("fa-IR").format(value); }
function detectCsvSeparator(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [",", ";", "\t", "،"];
  return candidates.reduce((best, candidate) => firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best, ",");
}

export default function BulkTransferPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const totalRial = useMemo(() => transfers.reduce((total, transfer) => total + transfer.amount, 0), [transfers]);

  const handleFile = async (file: File) => {
    setError(null); setNotice(null); setIsReading(true); setFileName(file.name);
    try {
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const csvText = isCsv ? await file.text() : "";
      const workbook = isCsv
        ? XLSX.read(csvText, { type: "string", raw: false, cellText: true, cellNF: false, FS: detectCsvSeparator(csvText) })
        : XLSX.read(await file.arrayBuffer(), { type: "array", raw: false, cellText: true, cellNF: false });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: "", raw: false });
      if (!rows.length) throw new Error("فایل خالی است.");
      const headerMap = getHeaderMap(rows[0]);
      const hasName = headerMap.name !== undefined || (headerMap.firstName !== undefined && headerMap.lastName !== undefined);
      const hasDestination = headerMap.destination !== undefined || headerMap.card !== undefined || headerMap.iban !== undefined;
      const missing: string[] = [];
      if (!hasName) missing.push("نام و نام خانوادگی");
      if (!hasDestination) missing.push("شماره شبا یا شماره کارت");
      if (headerMap.amount === undefined) missing.push("مبلغ به ریال");
      if (missing.length) {
        const detectedHeaders = rows[0].map((header) => String(header ?? "").trim()).filter(Boolean).join("، ");
        throw new Error(`ستون‌های ضروری پیدا نشد: ${missing.join("، ")}${detectedHeaders ? ` | ستون‌های شناسایی‌شده: ${detectedHeaders}` : ""}`);
      }
      const imported: TransferRow[] = [];
      let invalidCount = 0;
      rows.slice(1).forEach((row, index) => {
        const name = String(valueAt(row, headerMap.name) || `${valueAt(row, headerMap.firstName)} ${valueAt(row, headerMap.lastName)}`).replace(/\s+/g, " ").trim();
        const destination = cleanDestination(valueAt(row, headerMap.destination) || valueAt(row, headerMap.card) || valueAt(row, headerMap.iban));
        const amount = parseAmount(valueAt(row, headerMap.amount));
        if (!name && !destination && amount === null) return;
        if (!name || !isValidDestination(destination) || amount === null) { invalidCount += 1; return; }
        imported.push({ id: `${Date.now()}-${index}`, name, destination, amount });
      });
      if (!imported.length) throw new Error("هیچ ردیف معتبر قابل انتقالی در فایل پیدا نشد.");
      setTransfers(imported);
      setNotice(invalidCount ? `${invalidCount} ردیف به‌دلیل اطلاعات ناقص یا نادرست نادیده گرفته شد.` : `${imported.length} انتقال با موفقیت خوانده شد.`);
    } catch (readError) {
      setTransfers([]); setError(readError instanceof Error ? readError.message : "خواندن فایل انجام نشد.");
    } finally { setIsReading(false); }
  };

  return (
    <div className="flex flex-col gap-8">
      <div><h1 className="text-2xl font-semibold text-ink">انتقال تجمیعی</h1><p className="mt-1 text-base text-ink-muted">فایل Excel یا CSV را بارگذاری کنید تا انتقال‌ها برای بررسی در صف قرار بگیرند.</p></div>
      <section className="rounded-xl border border-line bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><h2 className="text-base font-semibold text-ink">بارگذاری فهرست انتقال‌ها</h2><p className="mt-2 text-sm leading-6 text-ink-muted">ستون‌های ضروری: نام و نام خانوادگی، شماره شبا یا کارت، مبلغ به ریال</p><p className="mt-1 text-xs text-ink-muted">فرمت‌های مجاز: .xlsx و .csv. فایل فقط در همین مرورگر پردازش می‌شود.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input ref={inputRef} id="bulk-file" type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file); }} />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={isReading} className="h-11 rounded-lg bg-navy-950 px-5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-wait disabled:opacity-60">{isReading ? "در حال خواندن..." : "انتخاب فایل"}</button>
            {fileName && <span className="flex items-center text-sm text-ink-muted">{fileName}</span>}
          </div>
        </div>
        {error && <p role="alert" className="mt-5 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
        {notice && <p role="status" className="mt-5 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">{notice}</p>}
      </section>
      {transfers.length > 0 && <section className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="font-semibold text-ink">صف انتقال‌ها</h2><p className="mt-1 text-sm text-ink-muted">مواردی را که نمی‌خواهید با دکمه حذف از صف خارج کنید.</p></div><span className="rounded-full bg-navy-950/5 px-3 py-1 text-sm text-navy-800">{formatNumber(transfers.length)} انتقال</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-right text-sm"><thead className="bg-surface text-ink-muted"><tr><th className="px-5 py-3 font-medium">ردیف</th><th className="px-5 py-3 font-medium">نام و نام خانوادگی</th><th className="px-5 py-3 font-medium">شماره مقصد</th><th className="px-5 py-3 font-medium">مبلغ (ریال)</th><th className="px-5 py-3 font-medium">عملیات</th></tr></thead><tbody className="divide-y divide-line">{transfers.map((transfer, index) => <tr key={transfer.id} className="hover:bg-surface/70"><td className="px-5 py-4 text-ink-muted">{formatNumber(index + 1)}</td><td className="px-5 py-4 font-medium text-ink">{transfer.name}</td><td className="px-5 py-4 font-mono text-xs text-ink" dir="ltr">{transfer.destination}</td><td className="px-5 py-4 text-ink" dir="ltr">{formatNumber(transfer.amount)}</td><td className="px-5 py-4"><button type="button" onClick={() => setTransfers((current) => current.filter((item) => item.id !== transfer.id))} className="rounded-md px-2 py-1 text-sm text-danger transition-colors hover:bg-danger/10">حذف</button></td></tr>)}</tbody></table></div>
        <div className="grid gap-3 border-t border-line bg-surface/60 p-5 sm:grid-cols-3"><div><p className="text-sm text-ink-muted">تعداد انتقالی</p><p className="mt-1 text-xl font-semibold text-navy-950">{formatNumber(transfers.length)} مورد</p></div><div><p className="text-sm text-ink-muted">مبلغ کل به ریال</p><p className="mt-1 text-xl font-semibold text-navy-950">{formatNumber(totalRial)} ریال</p></div><div><p className="text-sm text-ink-muted">مبلغ کل به تومان</p><p className="mt-1 text-xl font-semibold text-navy-950">{formatNumber(Math.floor(totalRial / 10))} تومان</p></div></div>
      </section>}
    </div>
  );
}
