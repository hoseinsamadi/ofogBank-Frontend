export function HorizonPanel() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-navy-950 px-12 py-14 lg:flex">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0b1f3a 0%, #14294a 55%, #1b2e4b 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-gold-500) 50%, transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.08) 100%)",
        }}
      />

      <span className="relative text-lg font-semibold tracking-tight text-white">
        افق بانک
      </span>

      <div className="relative flex flex-col gap-4">
        <h1 className="max-w-sm text-3xl font-semibold leading-relaxed text-white">
          بانکداری شما، همیشه در دسترس
        </h1>
        <p className="max-w-sm text-base leading-8 text-white/70">
          مدیریت حساب، کارت و تراکنش‌های خود را از یک نقطه، با امنیت کامل انجام دهید.
        </p>
      </div>
    </div>
  );
}
