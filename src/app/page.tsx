export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
        <div className="rounded-2xl border border-zinc-200/70 bg-white/60 p-10 backdrop-blur">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            One-template Portfolio Builder
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-zinc-600">
            Create a single, clean portfolio and customize it by adding
            sections, dragging them into any order, and editing content inline.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Get started
            </a>
            <a
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white/70 px-5 text-sm font-medium text-zinc-950 hover:bg-white"
            >
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
