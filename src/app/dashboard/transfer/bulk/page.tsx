"use client";

import { useMemo, useRef, useState } from "react";
import {
  parseBulkCsv,
  parseBulkExcel,
  type BulkTransferRow,
} from "@/lib/bulk-transfer/parse";
import { verifyBulkTransfers, type VerifiedTransfer } from "@/lib/bulk-transfer/verify";
import { saveBulkTransferReport } from "@/lib/bulk-transfer/report";
import { bankStatusMessage } from "@/lib/mock/bank";

const faNumber = new Intl.NumberFormat("fa-IR");

function formatRial(amount: number) {
  return faNumber.format(amount);
}

const SAMPLE_XLSX_URL = "/sample-bulk-transfer.xlsx";

function downloadSampleCsv() {
  const sample = [
    "نام و نام خانوادگی,شماره مقصد,مبلغ به ریال",
    "علی رضایی,6037997512345678,12500000",
    "مریم احمدی,IR120170000000123456789012,8700000",
    "رضا محمدی,5892101234567890,35000000",
    "سارا کریمی,IR120170000000123456789012,4200000",
  ].join("\n");

  const blob = new Blob(["﻿" + sample], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "نمونه فایل انتقال تجمیعی.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function BulkTransferPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BulkTransferRow[]>([]);
  const [verifiedRows, setVerifiedRows] = useState<VerifiedTransfer[] | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<{
    tone: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const isVerified = verifiedRows !== null && !isChecking;
  const displayRows: VerifiedTransfer[] = useMemo(
    () =>
      verifiedRows ??
      rows.map((row) => ({ ...row, status: "checking" as const })),
    [rows, verifiedRows]
  );

  const validRows = isVerified
    ? displayRows.filter((row) => row.status === "valid")
    : displayRows;
  const invalidRows = isVerified
    ? displayRows.filter((row) => row.status !== "valid")
    : [];

  const totalRial = validRows.reduce((sum, row) => sum + row.amountRial, 0);

  async function runVerification(parsedRows: BulkTransferRow[], fileName: string | null = null) {
    setIsChecking(true);
    setVerifiedRows(parsedRows.map((row) => ({ ...row, status: "checking" as const })));
    setStatus({ tone: "info", message: "در حال بررسی شماره حساب‌ها در بانک..." });

    const results = await verifyBulkTransfers(parsedRows, (partial) => {
      setVerifiedRows(partial);
    });

    setIsChecking(false);
    setVerifiedRows(results);

    const validCount = results.filter((row) => row.status === "valid").length;
    const invalidCount = results.length - validCount;
    const validTotal = results
      .filter((row) => row.status === "valid")
      .reduce((sum, row) => sum + row.amountRial, 0);
    const invalidTotal = results
      .filter((row) => row.status !== "valid")
      .reduce((sum, row) => sum + row.amountRial, 0);

    saveBulkTransferReport({
      id: `report-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      fileName,
      totalCount: results.length,
      validCount,
      invalidCount,
      validTotalRial: validTotal,
      invalidTotalRial: invalidTotal,
    });

    if (invalidCount === 0) {
      setStatus({
        tone: "success",
        message: `بررسی حساب‌ها کامل شد؛ هر ${faNumber.format(results.length)} شماره حساب در بانک موجود است.`,
      });
    } else {
      setStatus({
        tone: "error",
        message: `بررسی حساب‌ها کامل شد؛ ${faNumber.format(invalidCount)} مورد تأیید نشد و با رنگ قرمز مشخص شد. خطای ارتباطی به معنی نامعتبر بودن حساب نیست. گزارش در داشبورد ذخیره شد.`,
      });
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setFileError(null);
    setStatus(null);
    setRows([]);
    setVerifiedRows(null);

    const isCsv = file.name.toLowerCase().endsWith(".csv");
    const isExcel = file.name.toLowerCase().endsWith(".xlsx");

    if (!isCsv && !isExcel) {
      setFileError("فرمت فایل مجاز نیست. فقط .xlsx و.csv پشتیبانی می‌شود.");
      return;
    }

    const parsed = isCsv
      ? parseBulkCsv(await file.text())
      : await parseBulkExcel(await file.arrayBuffer());

    if (!parsed.ok) {
      setFileError(parsed.error);
      return;
    }

    setRows(parsed.rows);
    setStatus({
      tone: "success",
      message: `${faNumber.format(parsed.rows.length)} انتقال با موفقیت خوانده شد.`,
    });

    await runVerification(parsed.rows, file.name);
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
    setVerifiedRows((current) =>
      current ? current.filter((row) => row.id !== id) : current
    );
  }

  function resetQueue() {
    setRows([]);
    setVerifiedRows(null);
    setStatus(null);
    setFileError(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">انتقال تجمیعی</h1>
        <p className="mt-1 text-base text-ink-muted">
          فایل Excel یا CSV را بارگذاری کنید تا انتقال‌ها برای بررسی در صف قرار بگیرند.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">بارگذاری فهرست انتقال‌ها</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              ستون‌های ضروری: نام و نام خانوادگی، شماره شبا یا کارت، مبلغ به ریال
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              فرمت‌های مجاز: ‎.xlsx و‎.csv. فایل فقط در همین مرورگر پردازش می‌شود.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={fileInputRef}
              id="bulk-file"
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="sr-only"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="h-11 rounded-lg bg-navy-950 px-5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-wait disabled:opacity-60"
              disabled={isChecking}
              onClick={() => fileInputRef.current?.click()}
            >
              {isChecking ? "در حال بررسی..." : "انتخاب فایل"}
            </button>
            <a
              href={SAMPLE_XLSX_URL}
              download
              className="inline-flex h-11 items-center rounded-lg border border-line px-4 text-sm font-medium text-navy-800 transition-colors hover:border-navy-800 hover:bg-surface"
            >
              دانلود نمونه اکسل
            </a>
            <button
              type="button"
              className="text-sm text-navy-800 underline decoration-line underline-offset-4 hover:text-navy-700"
              onClick={downloadSampleCsv}
            >
              نمونه CSV
            </button>
          </div>
        </div>

        {fileError && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {fileError}
          </p>
        )}

        {status && !fileError && (
          <p
            role="status"
            className={`mt-5 rounded-lg px-4 py-3 text-sm ${
              status.tone === "success"
                ? "bg-success/10 text-success"
                : status.tone === "error"
                  ? "bg-danger/10 text-danger"
                  : "bg-navy-950/5 text-navy-800"
            }`}
          >
            {status.message}
          </p>
        )}
      </section>

      {displayRows.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="font-semibold text-ink">صف انتقال‌ها</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {isVerified
                  ? "ردیف‌های قرمز تأیید نشده‌اند؛ خطای ارتباطی به معنی نامعتبر بودن حساب نیست."
                  : "مواردی را که نمی‌خواهید با دکمه حذف از صف خارج کنید."}
              </p>
            </div>
            <span className="rounded-full bg-navy-950/5 px-3 py-1 text-sm text-navy-800">
              {faNumber.format(displayRows.length)} انتقال
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="bg-surface text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">ردیف</th>
                  <th className="px-5 py-3 font-medium">نام و نام خانوادگی</th>
                  <th className="px-5 py-3 font-medium">شماره مقصد</th>
                  <th className="px-5 py-3 font-medium">مبلغ (ریال)</th>
                  <th className="px-5 py-3 font-medium">وضعیت حساب</th>
                  <th className="px-5 py-3 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {displayRows.map((row, index) => {
                  const invalid = isVerified && row.status !== "valid";
                  const checking = row.status === "checking";

                  return (
                    <tr
                      key={row.id}
                      className={
                        invalid
                          ? "bg-danger/10 hover:bg-danger/15"
                          : "hover:bg-surface/70"
                      }
                    >
                      <td className="px-5 py-4 text-ink-muted">
                        {faNumber.format(index + 1)}
                      </td>
                      <td className="px-5 py-4 font-medium text-ink">{row.name}</td>
                      <td className="px-5 py-4 font-mono text-xs text-ink" dir="ltr">
                        {row.destination}
                      </td>
                      <td className="px-5 py-4 text-ink" dir="ltr">
                        {formatRial(row.amountRial)}
                      </td>
                      <td className="px-5 py-4">
                        {checking ? (
                          <span className="inline-flex items-center gap-2 text-navy-800">
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-navy-800/30 border-t-navy-800" />
                            در حال بررسی...
                          </span>
                        ) : invalid ? (
                          <span className="font-medium text-danger">
                            {bankStatusMessage(row.status as "not_found" | "invalid_format" | "unavailable")}
                          </span>
                        ) : (
                          <span className="text-success">{bankStatusMessage("valid")}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          disabled={isChecking}
                          onClick={() => removeRow(row.id)}
                          className="rounded-md px-2 py-1 text-sm text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 border-t border-line bg-surface/60 p-5 sm:grid-cols-3">
            <div>
              <p className="text-sm text-ink-muted">
                {isVerified ? "انتقالات تأییدشده" : "تعداد انتقالی"}
              </p>
              <p className="mt-1 text-xl font-semibold text-navy-950">
                {faNumber.format(validRows.length)} مورد
              </p>
            </div>
            <div>
              <p className="text-sm text-ink-muted">مبلغ کل به ریال</p>
              <p className="mt-1 text-xl font-semibold text-navy-950" dir="rtl">
                ریال {formatRial(totalRial)}
              </p>
            </div>
            <div>
              <p className="text-sm text-ink-muted">
                {isVerified ? "مورد تأییدنشده" : "مبلغ کل به تومان"}
              </p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  isVerified && invalidRows.length > 0 ? "text-danger" : "text-navy-950"
                }`}
                dir={isVerified ? undefined : "ltr"}
              >
                {isVerified
                  ? `${faNumber.format(invalidRows.length)} مورد`
                  : `${formatRial(Math.floor(totalRial / 10))} تومان`}
              </p>
            </div>
          </div>

          {rows.length > 0 && (
            <div className="flex flex-wrap gap-3 border-t border-line px-5 py-4">
              <button
                type="button"
                disabled={isChecking}
                onClick={() => runVerification(rows, null)}
                className="h-10 rounded-lg bg-navy-950 px-4 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                بررسی مجدد شماره حساب‌ها
              </button>
              <button
                type="button"
                disabled={isChecking}
                onClick={resetQueue}
                className="h-10 rounded-lg border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                پاک کردن صف
              </button>
            </div>
          )}
        </section>
      )}

      {isVerified && (
        <section className="rounded-xl border border-line bg-white p-6">
          <h2 className="text-base font-semibold text-ink">گزارش بررسی شماره حساب‌ها</h2>
          <p className="mt-1 text-sm text-ink-muted">
            این گزارش در داشبورد نیز ذخیره شده است.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-surface p-4">
              <p className="text-sm text-ink-muted">کل ردیف‌ها</p>
              <p className="mt-1 text-xl font-semibold text-navy-950">
                {faNumber.format(displayRows.length)} مورد
              </p>
            </div>
            <div className="rounded-lg bg-success/10 p-4">
              <p className="text-sm text-ink-muted">حساب موجود</p>
              <p className="mt-1 text-xl font-semibold text-success">
                {faNumber.format(validRows.length)} مورد
              </p>
            </div>
            <div className="rounded-lg bg-danger/10 p-4">
              <p className="text-sm text-ink-muted">حساب ناموجود</p>
              <p className="mt-1 text-xl font-semibold text-danger">
                {faNumber.format(invalidRows.length)} مورد
              </p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="text-sm text-ink-muted">مبلغ قابل انتقال</p>
              <p className="mt-1 text-xl font-semibold text-navy-950" dir="ltr">
                ریال {formatRial(totalRial)}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
