import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Not found
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            The page you requested doesn&apos;t exist.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
