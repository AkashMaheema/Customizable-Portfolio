import Link from "next/link";

export function Shell({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-800"
            >
              Portfolio Builder
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
            ) : null}
          </div>
          {right}
        </div>

        <div className="rounded-2xl border border-zinc-200/70 bg-white/60 p-6 backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  );
}
