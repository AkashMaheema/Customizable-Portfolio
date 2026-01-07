import Link from "next/link";

export function Shell({
  title,
  subtitle,
  children,
  right,
  fullWidth,
  noCard,
  maxWidth,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  fullWidth?: boolean;
  noCard?: boolean;
  maxWidth?: "4xl" | "5xl";
}) {
  const widthClass = maxWidth === "4xl" ? "max-w-4xl" : "max-w-5xl";

  return (
    <div className="min-h-screen bg-zinc-50">
      <div
        className={`mx-auto w-full ${
          fullWidth ? "max-w-none" : widthClass
        } ${"px-6"} py-10`}
      >
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
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

        {noCard ? (
          children
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
