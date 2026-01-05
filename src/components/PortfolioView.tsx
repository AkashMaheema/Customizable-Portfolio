import type { Sections } from "@/lib/types";

export function PortfolioView({
  username,
  sections,
}: {
  username: string;
  sections: Sections;
}) {
  const sorted = [...sections].sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="mb-12 rounded-2xl border border-zinc-200/70 bg-white/60 p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {username}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
            Portfolio
          </h1>
        </div>

        <div className="grid gap-8">
          {sorted.map((section) => {
            if (section.type === "hero") {
              const name = String(section.content.name ?? "");
              const headline = String(section.content.headline ?? "");
              const links = Array.isArray(section.content.links)
                ? (
                    section.content.links as Array<{
                      label?: unknown;
                      href?: unknown;
                    }>
                  ).map((l) => ({
                    label: String(l?.label ?? "Link"),
                    href: String(l?.href ?? "#"),
                  }))
                : [];

              return (
                <section
                  key={section.id}
                  className="rounded-2xl border border-zinc-200/70 bg-white/60 p-8 backdrop-blur"
                >
                  <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">
                    {name}
                  </h2>
                  <p className="mt-3 text-base leading-7 text-zinc-600">
                    {headline}
                  </p>
                  {links.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {links.map((l, i) => (
                        <a
                          key={`${section.id}_link_${i}`}
                          href={l.href}
                          className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-900 hover:bg-white"
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            }

            if (section.type === "about") {
              const body = String(section.content.body ?? "");
              return (
                <section
                  key={section.id}
                  className="rounded-2xl border border-zinc-200/70 bg-white/60 p-8 backdrop-blur"
                >
                  <h2 className="text-lg font-semibold text-zinc-950">About</h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-600">{body}</p>
                </section>
              );
            }

            if (section.type === "skills") {
              const items = Array.isArray(section.content.items)
                ? (section.content.items as unknown[]).map((x) => String(x))
                : [];
              return (
                <section
                  key={section.id}
                  className="rounded-2xl border border-zinc-200/70 bg-white/60 p-8 backdrop-blur"
                >
                  <h2 className="text-lg font-semibold text-zinc-950">
                    Skills
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {items.map((s, i) => (
                      <span
                        key={`${section.id}_skill_${i}`}
                        className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-900"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              );
            }

            if (section.type === "projects") {
              const items = Array.isArray(section.content.items)
                ? (
                    section.content.items as Array<{
                      name?: unknown;
                      description?: unknown;
                      href?: unknown;
                    }>
                  ).map((p) => ({
                    name: String(p?.name ?? "Project"),
                    description: String(p?.description ?? ""),
                    href: String(p?.href ?? "#"),
                  }))
                : [];

              return (
                <section
                  key={section.id}
                  className="rounded-2xl border border-zinc-200/70 bg-white/60 p-8 backdrop-blur"
                >
                  <h2 className="text-lg font-semibold text-zinc-950">
                    Projects
                  </h2>
                  <div className="mt-4 grid gap-3">
                    {items.map((p, i) => (
                      <a
                        key={`${section.id}_proj_${i}`}
                        href={p.href}
                        className="rounded-xl border border-zinc-200 bg-white/70 p-4 hover:bg-white"
                      >
                        <p className="text-sm font-medium text-zinc-950">
                          {p.name}
                        </p>
                        {p.description ? (
                          <p className="mt-1 text-sm text-zinc-600">
                            {p.description}
                          </p>
                        ) : null}
                      </a>
                    ))}
                  </div>
                </section>
              );
            }

            if (section.type === "contact") {
              const email = String(section.content.email ?? "");
              const location = String(section.content.location ?? "");

              return (
                <section
                  key={section.id}
                  className="rounded-2xl border border-zinc-200/70 bg-white/60 p-8 backdrop-blur"
                >
                  <h2 className="text-lg font-semibold text-zinc-950">
                    Contact
                  </h2>
                  <div className="mt-3 grid gap-2 text-sm text-zinc-600">
                    {email ? (
                      <a
                        className="text-zinc-900 underline"
                        href={`mailto:${email}`}
                      >
                        {email}
                      </a>
                    ) : null}
                    {location ? <p>{location}</p> : null}
                  </div>
                </section>
              );
            }

            // custom
            const title = String(section.content.title ?? "Custom");
            const body = String(section.content.body ?? "");

            return (
              <section
                key={section.id}
                className="rounded-2xl border border-zinc-200/70 bg-white/60 p-8 backdrop-blur"
              >
                <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
                {body ? (
                  <p className="mt-3 text-sm leading-7 text-zinc-600">{body}</p>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
