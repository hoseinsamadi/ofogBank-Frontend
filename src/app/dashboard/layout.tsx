"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { hasMockSession, clearMockSession } from "@/lib/mock/session";

const NAV_ITEMS = [
  { href: "/dashboard", label: "خلاصه حساب" },
  { href: "/dashboard/profile", label: "مشخصات و رمز عبور" },
  { href: "/dashboard/transfer", label: "انتقال تکی" },
  { href: "/dashboard/transfer/bulk", label: "انتقال تجمیعی" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!hasMockSession()) {
      router.replace("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  const handleLogout = () => {
    clearMockSession();
    router.push("/login");
  };

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-1">
      <div className="grid min-h-screen w-full lg:grid-cols-[16rem_1fr]">
        <aside className="hidden flex-col justify-between border-l border-line bg-navy-950 px-6 py-8 lg:flex">
          <div className="flex flex-col gap-8">
            <span className="text-lg font-semibold text-white">افق بانک</span>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-4 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-white/20 px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
          >
            خروج
          </button>
        </aside>

        <div className="flex flex-col">
          <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4 lg:hidden">
            <span className="text-base font-semibold text-navy-950">افق بانک</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-navy-800 underline decoration-line underline-offset-4"
            >
              خروج
            </button>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-2 lg:hidden">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                    active ? "bg-navy-950 text-white" : "text-ink-muted hover:bg-surface"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 bg-surface px-6 py-8 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
