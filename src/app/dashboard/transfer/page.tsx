"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { transferSchema, type TransferFormValues } from "@/lib/validation/transfer";

export default function TransferPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { destination: "", amount: "", description: "" },
  });

  const onSubmit = async (values: TransferFormValues) => {
    setSuccessMessage(null);
    // نسخه آزمایشی بدون بک‌اند: هیچ تماس API واقعی انجام نمی‌شود
    await new Promise((resolve) => setTimeout(resolve, 700));
    console.log("single transfer submit", values);
    setSuccessMessage("انتقال با موفقیت انجام شد (آزمایشی)");
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
              {...register("destination")}
            />
            {errors.destination && (
              <p id="destination-error" className="text-sm text-danger">
                {errors.destination.message}
              </p>
            )}
          </div>

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

          {successMessage && (
            <p role="status" className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 items-center justify-center rounded-lg bg-navy-950 text-base font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "در حال انتقال..." : "انتقال وجه"}
          </button>
        </form>
      </div>
    </div>
  );
}
