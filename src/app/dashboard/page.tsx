"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { mockUser } from "@/lib/mock/user";
import {
  getStoredBulkTransferReport,
  subscribeToBulkTransferReport,
} from "@/lib/bulk-transfer/report";

const faNumber = new Intl.NumberFormat("fa-IR");

function formatToman(amount: number) {
  return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
}

function formatReportDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function DashboardPage() {
  const report = useSyncExternalStore(
    subscribeToBulkTransferReport,
    getStoredBulkTransferReport,
    () => null
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">
          خوش آمدید، {mockUser.firstName} {mockUser.lastName}
        </h1>
        <p className="text-base text-ink-muted">
          این یک نسخه آزمایشی داشبورد است و به بک‌اند واقعی متصل نیست.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-white p-6">
        <p className="text-sm text-ink-muted">موجودی حساب (نمایشی)</p>
        <p className="mt-2 text-3xl font-semibold text-navy-950">
          {formatToman(mockUser.balance)}
        </p>
        <p className="mt-1 text-sm text-ink-muted" dir="rtl">
          شماره حساب: {mockUser.accountNumber}
        </p>
      </div>

      <section className="rounded-xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">گزارش انتقال تجمیعی</h2>
            <p className="mt-1 text-sm text-ink-muted">
              آخرین نتیجه بررسی شماره حساب‌ها در انتقال تجمیعی
            </p>
          </div>
          <Link
            href="/dashboard/transfer/bulk"
            className="text-sm text-navy-800 underline decoration-line underline-offset-4 hover:text-navy-700"
          >
            رفتن به انتقال تجمیعی
          </Link>
        </div>

        {report ? (
          <>
            {report.fileName && (
              <p className="mt-2 text-xs text-ink-muted">
                فایل: {report.fileName}
              </p>
            )}
            <p className="mt-4 text-xs text-ink-muted">
              تاریخ گزارش: {formatReportDate(report.generatedAt)}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-surface p-4">
                <p className="text-sm text-ink-muted">کل ردیف‌ها</p>
                <p className="mt-1 text-xl font-semibold text-navy-950">
                  {faNumber.format(report.totalCount)} مورد
                </p>
              </div>
              <div className="rounded-lg bg-success/10 p-4">
                <p className="text-sm text-ink-muted">حساب موجود</p>
                <p className="mt-1 text-xl font-semibold text-success">
                  {faNumber.format(report.validCount)} مورد
                </p>
              </div>
              <div className="rounded-lg bg-danger/10 p-4">
                <p className="text-sm text-ink-muted">حساب ناموجود</p>
                <p className="mt-1 text-xl font-semibold text-danger">
                  {faNumber.format(report.invalidCount)} مورد
                </p>
              </div>
              <div className="rounded-lg bg-surface p-4">
                <p className="text-sm text-ink-muted">مبلغ قابل انتقال</p>
                <p className="mt-1 text-xl font-semibold text-navy-950" dir="ltr">
                  ریال {faNumber.format(report.validTotalRial)}
                </p>
              </div>
            </div>

            {report.invalidCount > 0 && (
              <p className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                {faNumber.format(report.invalidCount)} شماره حساب در بانک موجود نیست؛
                برای مشاهده ردیف‌های قرمز به صفحه انتقال تجمیعی مراجعه کنید.
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm text-ink-muted">
            هنوز گزارشی ثبت نشده است. پس از بارگذاری فایل و بررسی شماره حساب‌ها، نتیجه
            اینجا نمایش داده می‌شود.
          </p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/profile"
          className="rounded-xl border border-line bg-white p-5 transition-colors hover:border-navy-800"
        >
          <h2 className="text-base font-semibold text-ink">مشخصات و رمز عبور</h2>
          <p className="mt-1 text-sm text-ink-muted">
            مشاهده اطلاعات حساب و تغییر رمز ورود
          </p>
        </Link>
        <Link
          href="/dashboard/transfer"
          className="rounded-xl border border-line bg-white p-5 transition-colors hover:border-navy-800"
        >
          <h2 className="text-base font-semibold text-ink">انتقال تکی</h2>
          <p className="mt-1 text-sm text-ink-muted">
            انتقال وجه با شماره کارت یا شماره شبا
          </p>
        </Link>
        <Link
          href="/dashboard/transfer/bulk"
          className="rounded-xl border border-line bg-white p-5 transition-colors hover:border-navy-800"
        >
          <h2 className="text-base font-semibold text-ink">انتقال تجمیعی</h2>
          <p className="mt-1 text-sm text-ink-muted">
            بارگذاری فایل و بررسی شماره حساب مقصد
          </p>
        </Link>
      </div>
    </div>
  );
}
