import type { Sections } from "@/lib/types";
import { PortfolioFreeLayout } from "@/components/PortfolioFreeLayout";

type SectionLayout = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  orientation?: "portrait" | "landscape";
};

type NormalizedLayout = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  orientation: "portrait" | "landscape";
};

function normalizeLayout(input: unknown): NormalizedLayout {
  const layout = (input ?? {}) as SectionLayout;
  const orientation =
    layout.orientation === "landscape" ? "landscape" : "portrait";

  return {
    x: typeof layout.x === "number" && Number.isFinite(layout.x) ? layout.x : 0,
    y: typeof layout.y === "number" && Number.isFinite(layout.y) ? layout.y : 0,
    w:
      typeof layout.w === "number" && Number.isFinite(layout.w) && layout.w > 0
        ? layout.w
        : undefined,
    h:
      typeof layout.h === "number" && Number.isFinite(layout.h) && layout.h > 0
        ? layout.h
        : undefined,
    orientation,
  };
}

function defaultSizePx(orientation: NormalizedLayout["orientation"]) {
  return orientation === "landscape" ? { w: 720, h: 320 } : { w: 448, h: 420 };
}

function wrapperClass() {
  // Small screens stack naturally; md+ is absolutely positioned.
  return "w-full";
}

type BackgroundStyle = {
  mode?: "solid" | "gradient";
  color?: string;
  from?: string;
  to?: string;
  direction?:
    | "to-r"
    | "to-l"
    | "to-b"
    | "to-t"
    | "to-br"
    | "to-bl"
    | "to-tr"
    | "to-tl";
};

function normalizeBackgroundStyle(input: unknown): Required<BackgroundStyle> {
  const bg = (input ?? {}) as BackgroundStyle;
  const mode = bg.mode === "gradient" ? "gradient" : "solid";

  return {
    mode,
    color: typeof bg.color === "string" && bg.color ? bg.color : "#ffffff",
    from: typeof bg.from === "string" && bg.from ? bg.from : "#ffffff",
    to: typeof bg.to === "string" && bg.to ? bg.to : "#ffffff",
    direction:
      bg.direction === "to-l" ||
      bg.direction === "to-b" ||
      bg.direction === "to-t" ||
      bg.direction === "to-br" ||
      bg.direction === "to-bl" ||
      bg.direction === "to-tr" ||
      bg.direction === "to-tl"
        ? bg.direction
        : "to-r",
  };
}

function directionToCss(dir: Required<BackgroundStyle>["direction"]) {
  switch (dir) {
    case "to-r":
      return "to right";
    case "to-l":
      return "to left";
    case "to-b":
      return "to bottom";
    case "to-t":
      return "to top";
    case "to-br":
      return "to bottom right";
    case "to-bl":
      return "to bottom left";
    case "to-tr":
      return "to top right";
    case "to-tl":
      return "to top left";
  }
}

function backgroundCss(bg: unknown): React.CSSProperties {
  const n = normalizeBackgroundStyle(bg);
  if (n.mode === "gradient") {
    return {
      backgroundImage: `linear-gradient(${directionToCss(n.direction)}, ${
        n.from
      }, ${n.to})`,
    };
  }
  return { backgroundColor: n.color };
}

export function PortfolioView({
  username,
  sections,
  page,
}: {
  username: string;
  sections: Sections;
  page?: { background?: { mode?: "solid" | "gradient"; color?: string } };
}) {
  const sorted = [...sections].sort((a, b) => a.position - b.position);
  const pageBackground = page?.background?.color;

  const hasFreeLayout = sorted.some((s) => {
    const l = (s as { layout?: unknown }).layout as SectionLayout | undefined;
    return typeof l?.x === "number" || typeof l?.y === "number";
  });

  if (hasFreeLayout) {
    return (
      <PortfolioFreeLayout
        username={username}
        sections={sections}
        pageBackground={pageBackground}
      />
    );
  }

  const heroFirst = sorted.length > 0 && sorted[0]?.type === "hero";

  return (
    <div
      className="min-h-screen"
      style={pageBackground ? { backgroundColor: pageBackground } : undefined}
    >
      <div className="mx-auto w-full max-w-5xl px-6 py-14">
        {heroFirst ? (
          (() => {
            const section = sorted[0];
            const name = String(section.content.name ?? username);
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
              <header
                className="mb-10 rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm"
                style={backgroundCss(section.style?.background)}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  @{username}
                </p>
                <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
                      {name}
                    </h1>
                    {headline ? (
                      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
                        {headline}
                      </p>
                    ) : null}
                    {links.length ? (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {links.map((l, i) => (
                          <a
                            key={`${section.id}_link_${i}`}
                            href={l.href}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 hover:bg-zinc-50"
                          >
                            {l.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="hidden lg:block">
                    <div className="h-28 w-28 rounded-3xl border border-zinc-200 bg-zinc-50" />
                  </div>
                </div>
              </header>
            );
          })()
        ) : (
          <header className="mb-10 rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              @{username}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
              Portfolio
            </h1>
          </header>
        )}

        <div className="grid gap-8">
          {sorted.map((section, index) => {
            if (heroFirst && index === 0) return null;

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
                  className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm"
                  style={backgroundCss(section.style?.background)}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Hero
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
                    {name || username}
                  </h2>
                  {headline ? (
                    <p className="mt-3 text-sm leading-7 text-zinc-600">
                      {headline}
                    </p>
                  ) : null}
                  {links.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {links.map((l, i) => (
                        <a
                          key={`${section.id}_link_${i}`}
                          href={l.href}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 hover:bg-zinc-50"
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
                  className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm"
                  style={backgroundCss(section.style?.background)}
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
                  className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm"
                  style={backgroundCss(section.style?.background)}
                >
                  <h2 className="text-lg font-semibold text-zinc-950">
                    Skills
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {items.map((s, i) => (
                      <span
                        key={`${section.id}_skill_${i}`}
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900"
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
                  className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm"
                  style={backgroundCss(section.style?.background)}
                >
                  <h2 className="text-lg font-semibold text-zinc-950">
                    Projects
                  </h2>
                  <div className="mt-4 grid gap-3">
                    {items.map((p, i) => (
                      <a
                        key={`${section.id}_proj_${i}`}
                        href={p.href}
                        className="group rounded-2xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-zinc-950">
                            {p.name}
                          </p>
                          <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-700">
                            View
                          </span>
                        </div>
                        {p.description ? (
                          <p className="mt-2 text-sm leading-7 text-zinc-600">
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
                  className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm"
                  style={backgroundCss(section.style?.background)}
                >
                  <h2 className="text-lg font-semibold text-zinc-950">
                    Contact
                  </h2>
                  <div className="mt-3 grid gap-2 text-sm text-zinc-600">
                    {email ? (
                      <a
                        className="text-zinc-950 underline underline-offset-4"
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
                className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm"
                style={backgroundCss(section.style?.background)}
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
