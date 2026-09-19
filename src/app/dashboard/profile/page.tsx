"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { mockUser } from "@/lib/mock/user";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/lib/validation/change-password";

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">مشخصات کاربری</h1>
        <p className="mt-1 text-base text-ink-muted">
          اطلاعات نمایشی زیر از داده آزمایشی خوانده می‌شود.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-white p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="نام و نام خانوادگی" value={`${mockUser.firstName} ${mockUser.lastName}`} />
          <InfoRow label="کد ملی" value={mockUser.nationalId} dir="ltr" />
          <InfoRow label="شماره حساب" value={mockUser.accountNumber} dir="ltr" />
          <InfoRow label="شماره کارت" value={mockUser.cardNumber} dir="ltr" />
          <InfoRow label="شماره شبا" value={mockUser.iban} dir="ltr" />
        </dl>
      </div>

      <ChangePasswordForm />
    </div>
  );
}

function InfoRow({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-base font-medium text-ink" dir={dir}>
        {value}
      </dd>
    </div>
  );
}

function ChangePasswordForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setSuccessMessage(null);
    // نسخه آزمایشی بدون بک‌اند: هیچ تماس API واقعی انجام نمی‌شود
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.log("change password submit", values);
    setSuccessMessage("رمز عبور با موفقیت تغییر کرد (آزمایشی)");
    reset();
  };

  return (
    <div className="rounded-xl border border-line bg-white p-6">
      <h2 className="text-lg font-semibold text-ink">تغییر رمز عبور</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 flex flex-col gap-5">
        <PasswordField
          id="currentPassword"
          label="رمز عبور فعلی"
          error={errors.currentPassword?.message}
          registration={register("currentPassword")}
        />
        <PasswordField
          id="newPassword"
          label="رمز عبور جدید"
          error={errors.newPassword?.message}
          registration={register("newPassword")}
        />
        <PasswordField
          id="confirmPassword"
          label="تکرار رمز عبور جدید"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
        />

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
          {isSubmitting ? "در حال ثبت..." : "تغییر رمز عبور"}
        </button>
      </form>
    </div>
  );
}

function PasswordField({
  id,
  label,
  error,
  registration,
}: {
  id: string;
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type="password"
        autoComplete="new-password"
        className="w-full rounded-lg border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 transition-colors focus:border-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-800/15 aria-invalid:border-danger aria-invalid:ring-danger/15"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...registration}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
