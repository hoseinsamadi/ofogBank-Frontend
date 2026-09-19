"use client";

import Link from "next/link";
import { mockUser } from "@/lib/mock/user";

function formatToman(amount: number) {
  return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
}

export default function DashboardPage() {
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
        <p className="mt-1 text-sm text-ink-muted" dir="ltr">
          شماره حساب: {mockUser.accountNumber}
        </p>
      </div>

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
          <p className="mt-1 text-sm text-ink-muted">به‌زودی فعال می‌شود</p>
        </Link>
      </div>
    </div>
  );
}
