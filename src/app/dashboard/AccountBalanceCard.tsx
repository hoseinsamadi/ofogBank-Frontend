"use client";

import { useCallback, useEffect, useState } from "react";

type Balance = {
  effectiveBalance: number | string;
  availableBalance: number | string;
};

function formatAmount(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(amount)
    : String(value);
}

export function AccountBalanceCard() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [message, setMessage] = useState("در حال دریافت موجودی از شاهین…");
  const [loading, setLoading] = useState(true);

  const loadBalance = useCallback(async () => {
    try {
      const response = await fetch("/api/shahin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "balance" }),
        cache: "no-store",
      });
      if (!response.ok) {
        setBalance(null);
        setMessage(response.status === 401 || response.status === 403
          ? "برای مشاهده موجودی باید با حساب مدیر سامانه وارد شوید."
          : "سرویس شاهین در دسترس نیست یا تنظیمات Sandbox کامل نشده است.");
        return;
      }
      const result = (await response.json()) as { data?: Balance };
      if (result.data?.effectiveBalance === undefined || result.data?.availableBalance === undefined) {
        setBalance(null);
        setMessage("پاسخ شاهین شامل فیلدهای مورد انتظار موجودی نبود.");
        return;
      }
      setBalance(result.data);
    } catch {
      setBalance(null);
      setMessage("ارتباط با سرویس شاهین برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBalance(), 0);
    return () => window.clearTimeout(timer);
  }, [loadBalance]);

  return (
    <section className="rounded-xl border border-line bg-white p-6" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">موجودی حساب شاهین</h2>
          <p className="mt-1 text-sm text-ink-muted">اطلاعات زنده از سرویس Sandbox شاهین</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setMessage("");
            void loadBalance();
          }}
          disabled={loading}
          className="rounded-lg border border-line px-3 py-2 text-sm text-navy-800 hover:bg-surface disabled:opacity-60"
        >
          {loading ? "در حال دریافت…" : "به‌روزرسانی"}
        </button>
      </div>
      {balance ? (
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-surface p-4">
            <dt className="text-sm text-ink-muted">مانده مؤثر</dt>
            <dd className="mt-2 text-2xl font-semibold text-navy-950" dir="ltr">
              {formatAmount(balance.effectiveBalance)}
            </dd>
          </div>
          <div className="rounded-lg bg-surface p-4">
            <dt className="text-sm text-ink-muted">مانده قابل‌دسترس</dt>
            <dd className="mt-2 text-2xl font-semibold text-navy-950" dir="ltr">
              {formatAmount(balance.availableBalance)}
            </dd>
          </div>
        </dl>
      ) : message ? (
        <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm text-ink-muted">{message}</p>
      ) : null}
      <p className="mt-3 text-xs text-ink-muted">واحد مبلغ طبق پاسخ سرویس شاهین است؛ این بخش هیچ انتقال وجهی انجام نمی‌دهد.</p>
    </section>
  );
}
