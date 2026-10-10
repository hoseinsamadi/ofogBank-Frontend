"use client";

import { useCurrentUser } from "../layout";

export default function ProfilePage() {
  const user = useCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">مشخصات کاربری</h1>
        <p className="mt-1 text-base text-ink-muted">اطلاعات این صفحه از نشست امن Backend خوانده می‌شود.</p>
      </div>

      <section className="rounded-xl border border-line bg-white p-6">
        <dl className="grid gap-5 sm:grid-cols-2">
          <InfoRow label="نام و نام خانوادگی" value={user.displayName} />
          <InfoRow label="کد ملی" value={user.nationalCode} />
          <InfoRow label="شناسه کاربر" value={user.id} />
        </dl>
      </section>

      <section className="rounded-xl border border-line bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">عضویت سازمانی</h2>
        {user.organizations.length ? (
          <ul className="mt-4 flex flex-col gap-3">
            {user.organizations.map((organization) => (
              <li key={organization.organizationId} className="rounded-lg bg-surface p-4">
                <p className="font-medium text-ink">{organization.organizationName}</p>
                <p className="mt-1 text-sm text-ink-muted">نقش: {organization.role}</p>
                <p className="mt-1 text-xs text-ink-muted" dir="ltr">{organization.organizationId}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">این حساب هنوز عضویت سازمانی ندارد.</p>
        )}
      </section>

      <p className="rounded-lg bg-surface px-4 py-3 text-sm text-ink-muted">
        اطلاعات حساب بانکی و تغییر رمز در Backend فعلی API ندارند و برای نمایش یا تغییر به اتصال سرویس مربوط نیاز دارند.
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="break-all text-base font-medium text-ink" dir="auto">{value}</dd>
    </div>
  );
}
