"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginFormValues } from "@/lib/validation/login";
import { setMockSession } from "@/lib/mock/session";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { nationalId: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    try {
      // نسخه آزمایشی بدون بک‌اند: هیچ تماس API واقعی انجام نمی‌شود
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log("login submit", values);
      setMockSession();
      router.push("/dashboard");
    } catch {
      setSubmitError("ورود ناموفق بود. کد ملی یا رمز عبور را بررسی کنید.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nationalId" className="text-sm font-medium text-ink">
          کد ملی
        </label>
        <input
          id="nationalId"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          placeholder="۱۰ رقم، مثل ۴۳۱۰۳۰۰۸۷۱"
          dir="ltr"
          maxLength={10}
          className="w-full rounded-lg border border-line bg-white px-4 py-3 text-right text-base text-ink placeholder:text-ink-muted/70 transition-colors focus:border-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-800/15 aria-invalid:border-danger aria-invalid:ring-danger/15"
          aria-invalid={!!errors.nationalId}
          aria-describedby={errors.nationalId ? "nationalId-error" : undefined}
          {...register("nationalId")}
        />
        {errors.nationalId && (
          <p id="nationalId-error" className="text-sm text-danger">
            {errors.nationalId.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-ink">
            رمز عبور
          </label>
          <a
            href="/forgot-password"
            className="text-sm text-navy-800 underline decoration-line underline-offset-4 hover:decoration-navy-800"
          >
            فراموشی رمز عبور
          </a>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="رمز عبور خود را وارد کنید"
            className="w-full rounded-lg border border-line bg-white px-4 py-3 pl-11 text-base text-ink placeholder:text-ink-muted/70 transition-colors focus:border-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-800/15 aria-invalid:border-danger aria-invalid:ring-danger/15"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-navy-800"
            aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-sm text-danger">
            {errors.password.message}
          </p>
        )}
      </div>

      {submitError && (
        <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 flex h-12 items-center justify-center rounded-lg bg-navy-950 text-base font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "در حال ورود..." : "ورود"}
      </button>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M6.5 6.7C4 8.3 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.4 4.7-1.1M9.9 5.2C10.6 5 11.3 5 12 5c6.5 0 10 7 10 7-.5.9-1.4 2.2-2.7 3.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
