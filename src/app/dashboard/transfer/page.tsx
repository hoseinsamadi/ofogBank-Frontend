"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { transferSchema, type TransferFormValues } from "@/lib/validation/transfer";
import {
  bankStatusMessage,
  inquireAccountOwner,
  normalizeDestination,
  type AccountInquiry,
} from "@/lib/mock/bank";
import { useCurrentUser } from "../layout";

// کارمزدها آزمایشی هستند (تومان)
const TRANSACTION_OPTIONS = [
  { value: "card_to_card", label: "کارت به کارت", fee: 720 },
  { value: "pol", label: "پل", fee: 1000 },
  { value: "paya", label: "پایا", fee: 2500 },
  { value: "satna", label: "ساتنا", fee: 3500 },
] as const;

const DEFAULT_TYPE = { card: "card_to_card", iban: "pol" } as const;

function findOption(value: string | undefined) {
  return TRANSACTION_OPTIONS.find((o) => o.value === value);
}

const fa = (n: number) => n.toLocaleString("fa-IR");

type Receipt = {
  typeLabel: string;
  ownerName: string;
  destination: string;
  amount: number;
  fee: number;
  description: string;
};

type InquiryState =
  | { phase: "loading"; destination: string }
  | { phase: "done"; destination: string; result: AccountInquiry };

export default function TransferPage() {
  const user = useCurrentUser();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inquiry, setInquiry] = useState<InquiryState | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { destination: "", amount: "", transactionType: "", description: "" },
  });

  const destination = useWatch({ control, name: "destination" });
  const amountValue = useWatch({ control, name: "amount" });
  const typeValue = useWatch({ control, name: "transactionType" });
  const normalizedDestination = normalizeDestination(destination ?? "");
  const currentInquiry = inquiry?.destination === normalizedDestination ? inquiry : null;

  useEffect(() => {
    const normalized = normalizedDestination;
    const looksComplete = /^\d{16}$/.test(normalized) || /^IR\d{24}$/.test(normalized);
    if (!looksComplete) return;
    let cancelled = false;
    inquireAccountOwner(normalized).then((result) => {
      if (cancelled) return;
      setInquiry({ phase: "done", destination: normalized, result });
      if (result.status === "valid") {
        setValue("transactionType", DEFAULT_TYPE[result.kind]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [normalizedDestination, setValue]);

  const validInquiry =
    currentInquiry?.phase === "done" && currentInquiry.result.status === "valid"
      ? currentInquiry.result
      : null;

  const selectedOption = findOption(typeValue);
  const amountNumber = /^\d+$/.test(amountValue ?? "") ? Number(amountValue) : 0;
  const fee = selectedOption?.fee ?? 0;

  const onSubmit = async (values: TransferFormValues) => {
    if (!validInquiry) return;
    setSuccessMessage(null);
    setReceipt(null);
    // نسخه آزمایشی بدون بک‌اند: هیچ تماس API واقعی انجام نمی‌شود
    await new Promise((resolve) => setTimeout(resolve, 700));
    const option = findOption(values.transactionType) ?? TRANSACTION_OPTIONS[0];
    setReceipt({
      typeLabel: option.label,
      ownerName: validInquiry.ownerName,
      destination: values.destination,
      amount: Number(values.amount),
      fee: option.fee,
      description: values.description ?? "",
    });
    setSuccessMessage("پیش‌نمایش رسید آماده شد؛ هیچ مبلغی منتقل نشده است.");
    reset();
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">انتقال تکی</h1>
        <p className="mt-1 text-base text-ink-muted">
          شماره کارت یا شماره شبای مقصد را وارد کنید. این عملیات آزمایشی است و مبلغی منتقل نمی‌شود.
        </p>
      </div>

      <div className="max-w-lg rounded-xl border border-line bg-white p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="destination" className="text-sm font-medium text-ink">
              شماره کارت یا شماره شبا
            </label>
            <input
              id="destination"
              type="text"
              dir="ltr"
              placeholder="مثل 6104337812345678 یا IR620570028180010203040506"
              className="w-full rounded-lg border border-line bg-white px-4 py-3 text-right text-base text-ink placeholder:text-ink-muted/70 transition-colors focus:border-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-800/15 aria-invalid:border-danger aria-invalid:ring-danger/15"
              aria-invalid={!!errors.destination}
              aria-describedby={errors.destination ? "destination-error" : undefined}
              {...register("destination", {
                onChange: (event) => {
                  const normalized = normalizeDestination(event.currentTarget.value);
                  setValue("transactionType", "");
                  if (/^\d{16}$/.test(normalized) || /^IR\d{24}$/.test(normalized)) {
                    setInquiry({ phase: "loading", destination: normalized });
                  } else {
                    setInquiry(null);
                  }
                },
              })}
            />
            {errors.destination && (
              <p id="destination-error" className="text-sm text-danger">
                {errors.destination.message}
              </p>
            )}
          </div>

          {currentInquiry?.phase === "loading" && (
            <p role="status" className="rounded-lg bg-surface px-4 py-3 text-sm text-ink-muted">
              در حال استعلام...
            </p>
          )}
          {currentInquiry?.phase === "done" && currentInquiry.result.status !== "valid" && (
            <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {bankStatusMessage(currentInquiry.result.status)}
            </p>
          )}
          {validInquiry && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">نام گیرنده</span>
              <div className="rounded-lg border border-line bg-surface px-4 py-3 text-base font-medium text-ink">
                {validInquiry.ownerName}
              </div>
            </div>
          )}

          {validInquiry && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="transactionType" className="text-sm font-medium text-ink">
                نوع تراکنش
              </label>
              <select
                id="transactionType"
                className="w-full rounded-lg border border-line bg-white px-4 py-3 text-base text-ink transition-colors focus:border-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-800/15"
                {...register("transactionType")}
              >
                {TRANSACTION_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label} — کارمزد {fa(t.fee)} تومان
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="amount" className="text-sm font-medium text-ink">
              مبلغ (تومان)
            </label>
            <input
              id="amount"
              type="text"
              inputMode="numeric"
              dir="ltr"
              placeholder="مثل 500000"
              className="w-full rounded-lg border border-line bg-white px-4 py-3 text-right text-base text-ink placeholder:text-ink-muted/70 transition-colors focus:border-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-800/15 aria-invalid:border-danger aria-invalid:ring-danger/15"
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? "amount-error" : undefined}
              {...register("amount")}
            />
            {errors.amount && (
              <p id="amount-error" className="text-sm text-danger">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-ink">
              توضیحات (اختیاری)
            </label>
            <input
              id="description"
              type="text"
              className="w-full rounded-lg border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 transition-colors focus:border-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-800/15"
              {...register("description")}
            />
          </div>

          {validInquiry && amountNumber > 0 && selectedOption && (
            <dl className="flex flex-col gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">مبلغ انتقال</dt>
                <dd className="font-medium text-ink">{fa(amountNumber)} تومان</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">کارمزد {selectedOption.label}</dt>
                <dd className="font-medium text-ink">{fa(fee)} تومان</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="font-medium text-ink">مجموع قابل پرداخت</dt>
                <dd className="font-semibold text-ink">{fa(amountNumber + fee)} تومان</dd>
              </div>
            </dl>
          )}

          {successMessage && (
            <p role="status" className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !validInquiry}
            className="flex h-12 items-center justify-center rounded-lg bg-navy-950 text-base font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "در حال آماده‌سازی..." : "پیش‌نمایش رسید"}
          </button>
        </form>
      </div>

      {receipt && (
        <div className="flex max-w-lg flex-col gap-4">
          <div id="print-receipt" className="rounded-xl border border-line bg-white p-6">
            <div className="mb-4 border-b border-line pb-3 text-center">
              <h2 className="text-lg font-semibold text-ink">رسید انتقال وجه — آفق بانک</h2>
              <p className="mt-1 text-xs text-ink-muted">تراکنش آزمایشی — مبلغی منتقل نشده است</p>
            </div>
            <dl className="flex flex-col gap-2 text-sm">
              {[
                ["وضعیت", "آزمایشی — انتقال انجام نشده"],
                ["نوع تراکنش", receipt.typeLabel],
                ["فرستنده", user.displayName],
                ["شماره شبای مبدا", "در این نسخه ثبت نشده است"],
                ["گیرنده", receipt.ownerName],
                ["شماره کارت/شبای مقصد", receipt.destination],
                ["مبلغ انتقال", `${fa(receipt.amount)} تومان`],
                ["کارمزد", `${fa(receipt.fee)} تومان`],
                ["مجموع", `${fa(receipt.amount + receipt.fee)} تومان`],
                ...(receipt.description ? [["توضیحات", receipt.description]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="font-medium text-ink" dir="auto">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-12 items-center justify-center rounded-lg border border-navy-800 text-base font-medium text-navy-800 transition-colors hover:bg-navy-800 hover:text-white"
          >
            چاپ رسید
          </button>
        </div>
      )}
    </div>
  );
}
