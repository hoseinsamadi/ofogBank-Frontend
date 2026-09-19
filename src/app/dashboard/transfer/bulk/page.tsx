export default function BulkTransferPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">انتقال تجمیعی</h1>
        <p className="mt-1 text-base text-ink-muted">
          امکان انتقال تجمیعی به چند حساب به‌زودی فعال می‌شود.
        </p>
      </div>

      <div className="max-w-lg rounded-xl border border-line bg-white p-6">
        <div className="rounded-lg bg-gold-400/15 px-4 py-3 text-sm text-navy-800">
          این بخش هنوز فعال نیست و صرفاً پیش‌نمایش رابط کاربری است.
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bulk-file" className="text-sm font-medium text-ink">
              فایل لیست انتقال‌ها (CSV)
            </label>
            <input
              id="bulk-file"
              type="file"
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-line bg-surface px-4 py-3 text-base text-ink-muted"
            />
          </div>

          <button
            type="button"
            disabled
            className="flex h-12 items-center justify-center rounded-lg bg-navy-950 text-base font-medium text-white opacity-60"
            aria-disabled="true"
          >
            به‌زودی فعال می‌شود
          </button>
        </div>
      </div>
    </div>
  );
}
