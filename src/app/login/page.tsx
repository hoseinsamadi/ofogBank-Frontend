import type { Metadata } from "next";
import { HorizonPanel } from "@/components/auth/HorizonPanel";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "ورود | افق بانک",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <HorizonPanel />

        <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
            <div className="flex flex-col gap-2 lg:hidden">
              <span className="text-lg font-semibold text-navy-950">افق بانک</span>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-ink">خوش آمدید</h2>
              <p className="text-base text-ink-muted">
                برای ورود به حساب خود، کد ملی و رمز عبور را وارد کنید.
              </p>
            </div>

            <LoginForm />

            <p className="text-center text-sm text-ink-muted">
              حساب کاربری ندارید؟{" "}
              <a
                href="/register"
                className="font-medium text-navy-800 underline decoration-line underline-offset-4 hover:decoration-navy-800"
              >
                ثبت‌نام کنید
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
