"use client";

import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Section, Sections } from "@/lib/types";
import { sectionsSchema } from "@/lib/validation";
import { Button, ButtonSecondary, LinkButton } from "@/components/Buttons";
import { useToast } from "@/components/ToastProvider";

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function newSection(type: Section["type"], position: number): Section {
  if (type === "hero") {
    return {
      id: uid(),
      type,
      position,
      layout: { x: 0, y: 0, w: 720, h: 320, orientation: "landscape" },
      content: {
        name: "Your Name",
        headline: "What you do, in one sentence.",
        links: [{ label: "Email", href: "mailto:you@example.com" }],
      },
    };
  }

  if (type === "about") {
    return {
      id: uid(),
      type,
      position,
      layout: { x: 0, y: 0, w: 448, h: 420, orientation: "portrait" },
      content: { body: "Write a short bio." },
    };
  }

  if (type === "skills") {
    return {
      id: uid(),
      type,
      position,
      layout: { x: 0, y: 0, w: 448, h: 420, orientation: "portrait" },
      content: { items: ["TypeScript", "React"] },
    };
  }

  if (type === "projects") {
    return {
      id: uid(),
      type,
      position,
      layout: { x: 0, y: 0, w: 720, h: 320, orientation: "landscape" },
      content: {
        items: [
          {
            name: "Project name",
            description: "One line describing it.",
            href: "https://example.com",
          },
        ],
      },
    };
  }

  if (type === "contact") {
    return {
      id: uid(),
      type,
      position,
      layout: { x: 0, y: 0, w: 448, h: 420, orientation: "portrait" },
      content: { email: "you@example.com", location: "City, Country" },
    };
  }

  return {
    id: uid(),
    type: "custom",
    position,
    layout: { x: 0, y: 0, w: 448, h: 420, orientation: "portrait" },
    content: { title: "Custom section", body: "" },
  };
}

function normalizePositions(sections: Section[]) {
  return sections
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s, i) => ({ ...s, position: i }));
}

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

function defaultSizePx(orientation: NormalizedLayout["orientation"]) {
  return orientation === "landscape" ? { w: 720, h: 320 } : { w: 448, h: 420 };
}

function normalizeLayout(input: unknown): NormalizedLayout {
  const layout = (input ?? {}) as SectionLayout;
  const orientation =
    layout.orientation === "landscape" ? "landscape" : "portrait";
  const size = defaultSizePx(orientation);

  const w =
    typeof layout.w === "number" && Number.isFinite(layout.w)
      ? layout.w
      : undefined;
  const h =
    typeof layout.h === "number" && Number.isFinite(layout.h)
      ? layout.h
      : undefined;

  return {
    x: typeof layout.x === "number" && Number.isFinite(layout.x) ? layout.x : 0,
    y: typeof layout.y === "number" && Number.isFinite(layout.y) ? layout.y : 0,
    w: w && w > 0 ? w : size.w,
    h: h && h > 0 ? h : size.h,
    orientation,
  };
}

function estimatedCardHeight(layout: NormalizedLayout) {
  return (layout.h ?? defaultSizePx(layout.orientation).h) + 40;
}

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num));
}

function ResizeHandle({
  layout,
  onSizeChange,
}: {
  layout: NormalizedLayout;
  onSizeChange: (next: { w?: number; h?: number }) => void;
}) {
  return (
    <button
      type="button"
      aria-label="Resize section"
      className="pointer-events-auto absolute bottom-4 right-4 h-5 w-5 cursor-nwse-resize rounded-md border border-zinc-200 bg-white"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startW = typeof layout.w === "number" ? layout.w : 0;
        const startH = typeof layout.h === "number" ? layout.h : 0;

        const move = (ev: PointerEvent) => {
          const nextW = Math.max(
            200,
            Math.min(5000, startW + (ev.clientX - startX))
          );
          const nextH = Math.max(
            200,
            Math.min(5000, startH + (ev.clientY - startY))
          );
          onSizeChange({ w: nextW, h: nextH });
        };

        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", up);
        };

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
      }}
    />
  );
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

function SortableChrome({
  section,
  dragHandle,
  background,
  onBackgroundChange,
  onOrientationChange,
  onSizeChange,
  onDelete,
}: {
  section: Section;
  dragHandle: React.ReactNode;
  background: Required<BackgroundStyle>;
  onBackgroundChange: (next: Required<BackgroundStyle>) => void;
  onOrientationChange: (next: Required<SectionLayout>["orientation"]) => void;
  onSizeChange: (next: { w?: number; h?: number }) => void;
  onDelete: () => void;
}) {
  const layout = normalizeLayout((section as { layout?: unknown }).layout);
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-2">
      {dragHandle}

      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1">
        <span className="text-xs font-medium text-zinc-700">Layout</span>
        <select
          value={layout.orientation}
          onChange={(e) =>
            onOrientationChange(
              e.target.value === "landscape" ? "landscape" : "portrait"
            )
          }
          className="h-7 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-950 outline-none focus:border-zinc-400"
          aria-label="Section orientation"
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>

        <input
          type="number"
          inputMode="numeric"
          value={
            Number.isFinite(layout.w) ? String(Math.round(layout.w ?? 0)) : ""
          }
          onChange={(e) => {
            const next = Number(e.target.value);
            onSizeChange({
              w: Number.isFinite(next) && next > 0 ? next : undefined,
            });
          }}
          className="h-7 w-20 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-950 outline-none focus:border-zinc-400"
          aria-label="Section width in px"
          placeholder="W"
          min={200}
          max={5000}
        />
        <input
          type="number"
          inputMode="numeric"
          value={
            Number.isFinite(layout.h) ? String(Math.round(layout.h ?? 0)) : ""
          }
          onChange={(e) => {
            const next = Number(e.target.value);
            onSizeChange({
              h: Number.isFinite(next) && next > 0 ? next : undefined,
            });
          }}
          className="h-7 w-20 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-950 outline-none focus:border-zinc-400"
          aria-label="Section height in px"
          placeholder="H"
          min={200}
          max={5000}
        />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1">
        <span className="text-xs font-medium text-zinc-700">Bg</span>
        <select
          value={background.mode}
          onChange={(e) =>
            onBackgroundChange({
              ...background,
              mode: e.target.value as Required<BackgroundStyle>["mode"],
            })
          }
          className="h-7 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-950 outline-none focus:border-zinc-400"
          aria-label="Section background mode"
        >
          <option value="solid">Solid</option>
          <option value="gradient">Gradient</option>
        </select>

        {background.mode === "solid" ? (
          <input
            type="color"
            value={background.color}
            onChange={(e) =>
              onBackgroundChange({ ...background, color: e.target.value })
            }
            aria-label="Section background color"
            className="h-6 w-8 rounded-md border border-zinc-200 bg-white p-0"
          />
        ) : (
          <>
            <select
              value={background.direction}
              onChange={(e) =>
                onBackgroundChange({
                  ...background,
                  direction: e.target
                    .value as Required<BackgroundStyle>["direction"],
                })
              }
              className="h-7 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-950 outline-none focus:border-zinc-400"
              aria-label="Gradient direction"
            >
              <option value="to-r">→</option>
              <option value="to-l">←</option>
              <option value="to-b">↓</option>
              <option value="to-t">↑</option>
              <option value="to-br">↘</option>
              <option value="to-bl">↙</option>
              <option value="to-tr">↗</option>
              <option value="to-tl">↖</option>
            </select>
            <input
              type="color"
              value={background.from}
              onChange={(e) =>
                onBackgroundChange({ ...background, from: e.target.value })
              }
              aria-label="Gradient from color"
              className="h-6 w-8 rounded-md border border-zinc-200 bg-white p-0"
            />
            <input
              type="color"
              value={background.to}
              onChange={(e) =>
                onBackgroundChange({ ...background, to: e.target.value })
              }
              aria-label="Gradient to color"
              className="h-6 w-8 rounded-md border border-zinc-200 bg-white p-0"
            />
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="inline-flex h-8 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
      >
        Delete
      </button>

      <span className="hidden sm:inline text-xs font-medium uppercase tracking-wide text-zinc-500">
        {section.type}
      </span>
    </div>
  );
}

function HeroLinksEditor({
  links,
  onChange,
}: {
  links: Array<{ label: string; href: string }>;
  onChange: (next: Array<{ label: string; href: string }>) => void;
}) {
  return (
    <div className="mt-4 grid gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-700">Links</p>
        <button
          type="button"
          className="text-xs font-medium text-zinc-900 underline"
          onClick={() => onChange([...links, { label: "Link", href: "#" }])}
        >
          Add
        </button>
      </div>

      {links.length ? (
        <div className="grid gap-2">
          {links.map((l, i) => (
            <div
              key={`hero_link_${i}`}
              className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-700">
                    Label
                  </span>
                  <input
                    className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none focus:border-zinc-400"
                    value={l.label}
                    onChange={(e) => {
                      const next = links.slice();
                      next[i] = { ...l, label: e.target.value };
                      onChange(next);
                    }}
                    placeholder="Email"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-700">URL</span>
                  <input
                    className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none focus:border-zinc-400"
                    value={l.href}
                    onChange={(e) => {
                      const next = links.slice();
                      next[i] = { ...l, href: e.target.value };
                      onChange(next);
                    }}
                    placeholder="https://... or mailto:..."
                  />
                </label>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-xs text-zinc-500 hover:text-zinc-900"
                  onClick={() => onChange(links.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-600">No links yet.</p>
      )}
    </div>
  );
}

function SortablePreviewSection({
  section,
  username,
  onChange,
  onDelete,
  registerSectionNode,
}: {
  section: Section;
  username: string;
  onChange: (next: Section) => void;
  onDelete: () => void;
  registerSectionNode?: (id: string, node: HTMLElement | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: section.id });

  const setRefs = (node: HTMLElement | null) => {
    setNodeRef(node);
    registerSectionNode?.(section.id, node);
  };

  const layout = normalizeLayout((section as { layout?: unknown }).layout);
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    left: layout.x,
    top: layout.y,
    zIndex: 1 + section.position,
    width: typeof layout.w === "number" ? layout.w : undefined,
    height: typeof layout.h === "number" ? layout.h : undefined,
    maxWidth: "100%",
  };

  const background = normalizeBackgroundStyle(section.style?.background);
  const containerStyle = {
    ...style,
    ...backgroundCss(section.style?.background),
  };

  const dragHandle = (
    <button
      type="button"
      className="inline-flex h-8 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50 active:cursor-grabbing"
      {...attributes}
      {...listeners}
      aria-label="Drag handle"
    >
      Drag
    </button>
  );

  const resizeHandle = (
    <button
      type="button"
      className="pointer-events-auto absolute bottom-3 right-3 h-4 w-4 rounded border border-zinc-200 bg-white/90 touch-none cursor-nwse-resize"
      aria-label="Resize section"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const start = normalizeLayout((section as { layout?: unknown }).layout);

        const onMove = (ev: PointerEvent) => {
          const nextW = clamp(start.w + (ev.clientX - startX), 240, 5000);
          const nextH = clamp(start.h + (ev.clientY - startY), 240, 5000);

          onChange({
            ...section,
            layout: { ...start, w: nextW, h: nextH },
          });
        };

        const onUp = () => {
          window.removeEventListener("pointermove", onMove, true);
          window.removeEventListener("pointerup", onUp, true);
        };

        window.addEventListener("pointermove", onMove, true);
        window.addEventListener("pointerup", onUp, true);
      }}
    />
  );

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
        ref={setRefs}
        style={containerStyle}
        className={`md:absolute relative overflow-auto rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm ${
          isDragging ? "opacity-80" : ""
        }`}
      >
        <div className="absolute right-4 top-4">
          <SortableChrome
            section={section}
            dragHandle={dragHandle}
            background={background}
            onBackgroundChange={(nextBg) =>
              onChange({
                ...section,
                style: {
                  ...(section.style ?? {}),
                  background: nextBg,
                },
              })
            }
            onOrientationChange={(nextOrientation) =>
              onChange({
                ...section,
                layout: { ...layout, orientation: nextOrientation },
              })
            }
            onSizeChange={(nextSize) =>
              onChange({
                ...section,
                layout: { ...layout, ...nextSize },
              })
            }
            onDelete={onDelete}
          />
        </div>

        <ResizeHandle
          layout={layout}
          onSizeChange={(nextSize) =>
            onChange({
              ...section,
              layout: { ...layout, ...nextSize },
            })
          }
        />

        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Hero
        </p>
        <label className="mt-3 block">
          <span className="sr-only">Name</span>
          <input
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-2xl font-semibold tracking-tight text-zinc-950 outline-none focus:border-zinc-400"
            value={name}
            onChange={(e) =>
              onChange({
                ...section,
                content: { ...section.content, name: e.target.value },
              })
            }
            placeholder={username}
          />
        </label>

        <label className="mt-4 block">
          <span className="sr-only">Headline</span>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-7 text-zinc-700 outline-none focus:border-zinc-400"
            value={headline}
            onChange={(e) =>
              onChange({
                ...section,
                content: { ...section.content, headline: e.target.value },
              })
            }
            placeholder="Your headline"
          />
        </label>

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

        <HeroLinksEditor
          links={links}
          onChange={(nextLinks) =>
            onChange({
              ...section,
              content: { ...section.content, links: nextLinks },
            })
          }
        />

        {resizeHandle}
      </section>
    );
  }

  if (section.type === "about") {
    const body = String(section.content.body ?? "");
    return (
      <section
        ref={setRefs}
        style={containerStyle}
        className={`md:absolute relative overflow-auto rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm ${
          isDragging ? "opacity-80" : ""
        }`}
      >
        <div className="absolute right-4 top-4">
          <SortableChrome
            section={section}
            dragHandle={dragHandle}
            background={background}
            onBackgroundChange={(nextBg) =>
              onChange({
                ...section,
                style: {
                  ...(section.style ?? {}),
                  background: nextBg,
                },
              })
            }
            onOrientationChange={(nextOrientation) =>
              onChange({
                ...section,
                layout: { ...layout, orientation: nextOrientation },
              })
            }
            onSizeChange={(nextSize) =>
              onChange({
                ...section,
                layout: { ...layout, ...nextSize },
              })
            }
            onDelete={onDelete}
          />
        </div>

        <ResizeHandle
          layout={layout}
          onSizeChange={(nextSize) =>
            onChange({
              ...section,
              layout: { ...layout, ...nextSize },
            })
          }
        />

        <h2 className="text-lg font-semibold text-zinc-950">About</h2>
        <textarea
          className="mt-3 min-h-28 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-7 text-zinc-700 outline-none focus:border-zinc-400"
          value={body}
          onChange={(e) =>
            onChange({
              ...section,
              content: { ...section.content, body: e.target.value },
            })
          }
          placeholder="Write a short bio."
        />

        {resizeHandle}
      </section>
    );
  }

  if (section.type === "skills") {
    const items = Array.isArray(section.content.items)
      ? (section.content.items as unknown[]).map((x) => String(x))
      : [];
    const value = items.join(", ");
    return (
      <section
        ref={setRefs}
        style={containerStyle}
        className={`md:absolute relative overflow-auto rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm ${
          isDragging ? "opacity-80" : ""
        }`}
      >
        <div className="absolute right-4 top-4">
          <SortableChrome
            section={section}
            dragHandle={dragHandle}
            background={background}
            onBackgroundChange={(nextBg) =>
              onChange({
                ...section,
                style: {
                  ...(section.style ?? {}),
                  background: nextBg,
                },
              })
            }
            onOrientationChange={(nextOrientation) =>
              onChange({
                ...section,
                layout: { ...layout, orientation: nextOrientation },
              })
            }
            onSizeChange={(nextSize) =>
              onChange({
                ...section,
                layout: { ...layout, ...nextSize },
              })
            }
            onDelete={onDelete}
          />
        </div>

        <ResizeHandle
          layout={layout}
          onSizeChange={(nextSize) =>
            onChange({
              ...section,
              layout: { ...layout, ...nextSize },
            })
          }
        />

        <h2 className="text-lg font-semibold text-zinc-950">Skills</h2>
        <input
          className="mt-4 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none focus:border-zinc-400"
          value={value}
          onChange={(e) =>
            onChange({
              ...section,
              content: {
                ...section.content,
                items: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
          placeholder="TypeScript, React, ..."
        />
        {items.length ? (
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
        ) : null}

        {resizeHandle}
      </section>
    );
  }

  if (section.type === "projects") {
    return (
      <section
        ref={setRefs}
        style={containerStyle}
        className={`md:absolute relative overflow-auto rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm ${
          isDragging ? "opacity-80" : ""
        }`}
      >
        <div className="absolute right-4 top-4">
          <SortableChrome
            section={section}
            dragHandle={dragHandle}
            background={background}
            onBackgroundChange={(nextBg) =>
              onChange({
                ...section,
                style: {
                  ...(section.style ?? {}),
                  background: nextBg,
                },
              })
            }
            onOrientationChange={(nextOrientation) =>
              onChange({
                ...section,
                layout: { ...layout, orientation: nextOrientation },
              })
            }
            onSizeChange={(nextSize) =>
              onChange({
                ...section,
                layout: { ...layout, ...nextSize },
              })
            }
            onDelete={onDelete}
          />
        </div>

        <ResizeHandle
          layout={layout}
          onSizeChange={(nextSize) =>
            onChange({
              ...section,
              layout: { ...layout, ...nextSize },
            })
          }
        />
        <h2 className="text-lg font-semibold text-zinc-950">Projects</h2>
        <div className="mt-4">
          <ProjectsEditor section={section} onChange={onChange} />
        </div>

        {resizeHandle}
      </section>
    );
  }

  if (section.type === "contact") {
    const email = String(section.content.email ?? "");
    const location = String(section.content.location ?? "");
    return (
      <section
        ref={setRefs}
        style={containerStyle}
        className={`md:absolute relative overflow-auto rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm ${
          isDragging ? "opacity-80" : ""
        }`}
      >
        <div className="absolute right-4 top-4">
          <SortableChrome
            section={section}
            dragHandle={dragHandle}
            background={background}
            onBackgroundChange={(nextBg) =>
              onChange({
                ...section,
                style: {
                  ...(section.style ?? {}),
                  background: nextBg,
                },
              })
            }
            onOrientationChange={(nextOrientation) =>
              onChange({
                ...section,
                layout: { ...layout, orientation: nextOrientation },
              })
            }
            onSizeChange={(nextSize) =>
              onChange({
                ...section,
                layout: { ...layout, ...nextSize },
              })
            }
            onDelete={onDelete}
          />
        </div>

        <ResizeHandle
          layout={layout}
          onSizeChange={(nextSize) =>
            onChange({
              ...section,
              layout: { ...layout, ...nextSize },
            })
          }
        />

        <h2 className="text-lg font-semibold text-zinc-950">Contact</h2>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-700">Email</span>
            <input
              className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none focus:border-zinc-400"
              value={email}
              onChange={(e) =>
                onChange({
                  ...section,
                  content: { ...section.content, email: e.target.value },
                })
              }
              placeholder="you@example.com"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-700">Location</span>
            <input
              className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none focus:border-zinc-400"
              value={location}
              onChange={(e) =>
                onChange({
                  ...section,
                  content: { ...section.content, location: e.target.value },
                })
              }
              placeholder="City, Country"
            />
          </label>
        </div>

        {resizeHandle}
      </section>
    );
  }

  // custom
  const title = String(section.content.title ?? "");
  const body = String(section.content.body ?? "");
  return (
    <section
      ref={setRefs}
      style={containerStyle}
      className={`md:absolute relative overflow-auto rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm ${
        isDragging ? "opacity-80" : ""
      }`}
    >
      <div className="absolute right-4 top-4">
        <SortableChrome
          section={section}
          dragHandle={dragHandle}
          background={background}
          onBackgroundChange={(nextBg) =>
            onChange({
              ...section,
              style: {
                ...(section.style ?? {}),
                background: nextBg,
              },
            })
          }
          onOrientationChange={(nextOrientation) =>
            onChange({
              ...section,
              layout: { ...layout, orientation: nextOrientation },
            })
          }
          onSizeChange={(nextSize) =>
            onChange({
              ...section,
              layout: { ...layout, ...nextSize },
            })
          }
          onDelete={onDelete}
        />
      </div>

      <ResizeHandle
        layout={layout}
        onSizeChange={(nextSize) =>
          onChange({
            ...section,
            layout: { ...layout, ...nextSize },
          })
        }
      />
      <label className="grid gap-1">
        <span className="text-xs font-medium text-zinc-700">Title</span>
        <input
          className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 outline-none focus:border-zinc-400"
          value={title}
          onChange={(e) =>
            onChange({
              ...section,
              content: { ...section.content, title: e.target.value },
            })
          }
          placeholder="Custom section"
        />
      </label>
      <label className="mt-4 grid gap-1">
        <span className="text-xs font-medium text-zinc-700">Body</span>
        <textarea
          className="min-h-28 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-7 text-zinc-700 outline-none focus:border-zinc-400"
          value={body}
          onChange={(e) =>
            onChange({
              ...section,
              content: { ...section.content, body: e.target.value },
            })
          }
          placeholder="Write something..."
        />
      </label>

      {resizeHandle}
    </section>
  );
}

function SortableHeroHeader({
  section,
  username,
  onChange,
  onDelete,
  registerSectionNode,
}: {
  section: Section;
  username: string;
  onChange: (next: Section) => void;
  onDelete: () => void;
  registerSectionNode?: (id: string, node: HTMLElement | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: section.id });

  const setRefs = (node: HTMLElement | null) => {
    setNodeRef(node);
    registerSectionNode?.(section.id, node);
  };

  const layout = normalizeLayout((section as { layout?: unknown }).layout);
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    left: layout.x,
    top: layout.y,
    zIndex: 1 + section.position,
    width: typeof layout.w === "number" ? layout.w : undefined,
    height: typeof layout.h === "number" ? layout.h : undefined,
    maxWidth: "100%",
  };

  const background = normalizeBackgroundStyle(section.style?.background);
  const containerStyle = {
    ...style,
    ...backgroundCss(section.style?.background),
  };

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

  const dragHandle = (
    <button
      type="button"
      className="inline-flex h-8 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-50 active:cursor-grabbing"
      {...attributes}
      {...listeners}
      aria-label="Drag handle"
    >
      Drag
    </button>
  );

  const resizeHandle = (
    <button
      type="button"
      className="pointer-events-auto absolute bottom-3 right-3 h-4 w-4 rounded border border-zinc-200 bg-white/90 touch-none cursor-nwse-resize"
      aria-label="Resize section"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const start = normalizeLayout((section as { layout?: unknown }).layout);

        const onMove = (ev: PointerEvent) => {
          const nextW = clamp(start.w + (ev.clientX - startX), 240, 5000);
          const nextH = clamp(start.h + (ev.clientY - startY), 240, 5000);

          onChange({
            ...section,
            layout: { ...start, w: nextW, h: nextH },
          });
        };

        const onUp = () => {
          window.removeEventListener("pointermove", onMove, true);
          window.removeEventListener("pointerup", onUp, true);
        };

        window.addEventListener("pointermove", onMove, true);
        window.addEventListener("pointerup", onUp, true);
      }}
    />
  );

  return (
    <header
      ref={setNodeRef}
      style={containerStyle}
      className={`md:absolute relative rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm ${
        isDragging ? "opacity-80" : ""
      }`}
    >
      <div className="absolute right-4 top-4">
        <SortableChrome
          section={section}
          dragHandle={dragHandle}
          background={background}
          onBackgroundChange={(nextBg) =>
            onChange({
              ...section,
              style: {
                ...(section.style ?? {}),
                background: nextBg,
              },
            })
          }
          onOrientationChange={(nextOrientation) =>
            onChange({
              ...section,
              layout: { ...layout, orientation: nextOrientation },
            })
          }
          onSizeChange={(nextSize) =>
            onChange({
              ...section,
              layout: { ...layout, ...nextSize },
            })
          }
          onDelete={onDelete}
        />
      </div>

      <ResizeHandle
        layout={layout}
        onSizeChange={(nextSize) =>
          onChange({
            ...section,
            layout: { ...layout, ...nextSize },
          })
        }
      />

      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        @{username}
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <label className="block">
            <span className="sr-only">Name</span>
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-4xl font-semibold tracking-tight text-zinc-950 outline-none focus:border-zinc-400"
              value={name}
              onChange={(e) =>
                onChange({
                  ...section,
                  content: { ...section.content, name: e.target.value },
                })
              }
              placeholder={username}
            />
          </label>

          <label className="mt-4 block">
            <span className="sr-only">Headline</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base leading-7 text-zinc-700 outline-none focus:border-zinc-400"
              value={headline}
              onChange={(e) =>
                onChange({
                  ...section,
                  content: { ...section.content, headline: e.target.value },
                })
              }
              placeholder="What you do, in one sentence."
            />
          </label>

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

          <HeroLinksEditor
            links={links}
            onChange={(nextLinks) =>
              onChange({
                ...section,
                content: { ...section.content, links: nextLinks },
              })
            }
          />
        </div>

        <div className="hidden lg:block">
          <div className="h-28 w-28 rounded-3xl border border-zinc-200 bg-zinc-50" />
        </div>
      </div>

      {resizeHandle}
    </header>
  );
}

function ProjectsEditor({
  section,
  onChange,
}: {
  section: Section;
  onChange: (next: Section) => void;
}) {
  const items = Array.isArray(section.content.items)
    ? (
        section.content.items as Array<{
          name?: unknown;
          description?: unknown;
          href?: unknown;
        }>
      ).map((p) => ({
        name: String(p?.name ?? ""),
        description: String(p?.description ?? ""),
        href: String(p?.href ?? ""),
      }))
    : [];

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-700">Edit projects</p>
        <button
          type="button"
          className="text-xs font-medium text-zinc-900 underline"
          onClick={() =>
            onChange({
              ...section,
              content: {
                ...section.content,
                items: [...items, { name: "", description: "", href: "" }],
              },
            })
          }
        >
          Add
        </button>
      </div>

      <div className="grid gap-3">
        {items.map((p, idx) => (
          <div
            key={`${section.id}_proj_${idx}`}
            className="rounded-2xl border border-zinc-200 bg-white p-5"
          >
            <div className="grid gap-2">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-zinc-700">Name</span>
                <input
                  className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none focus:border-zinc-400"
                  value={p.name}
                  onChange={(e) => {
                    const next = items.slice();
                    next[idx] = { ...p, name: e.target.value };
                    onChange({
                      ...section,
                      content: { ...section.content, items: next },
                    });
                  }}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-zinc-700">
                  Description
                </span>
                <input
                  className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none focus:border-zinc-400"
                  value={p.description}
                  onChange={(e) => {
                    const next = items.slice();
                    next[idx] = { ...p, description: e.target.value };
                    onChange({
                      ...section,
                      content: { ...section.content, items: next },
                    });
                  }}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-zinc-700">Link</span>
                <input
                  className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none focus:border-zinc-400"
                  value={p.href}
                  onChange={(e) => {
                    const next = items.slice();
                    next[idx] = { ...p, href: e.target.value };
                    onChange({
                      ...section,
                      content: { ...section.content, items: next },
                    });
                  }}
                />
              </label>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-xs text-zinc-500 hover:text-zinc-900"
                  onClick={() => {
                    const next = items.filter((_, i) => i !== idx);
                    onChange({
                      ...section,
                      content: { ...section.content, items: next },
                    });
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EditorClient({
  username,
  initialSections,
  initialPage,
}: {
  username: string;
  initialSections: Sections;
  initialPage?: {
    background?: { mode?: "solid" | "gradient"; color?: string };
  };
}) {
  const router = useRouter();
  const toast = useToast();

  const sectionNodes = useRef<Record<string, HTMLElement | null>>({});
  const registerSectionNode = (id: string, node: HTMLElement | null) => {
    sectionNodes.current[id] = node;
  };

  const [sections, setSections] = useState<Section[]>(() =>
    normalizePositions(initialSections).map((s, i) => {
      const layout = (s as { layout?: unknown }).layout;
      const normalized = normalizeLayout(layout);
      const seeded =
        typeof (layout as SectionLayout | undefined)?.x === "number" ||
        typeof (layout as SectionLayout | undefined)?.y === "number"
          ? normalized
          : { ...normalized, x: 0, y: i * 220 };

      return { ...s, layout: seeded };
    })
  );

  const [pageBackground, setPageBackground] = useState(
    String(initialPage?.background?.color ?? "#ffffff")
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newType, setNewType] = useState<Section["type"]>("custom");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const ordered = useMemo(
    () => sections.slice().sort((a, b) => a.position - b.position),
    [sections]
  );

  const GRID_PX = 32;
  const DEFAULT_SECTION_GAP_PX = GRID_PX;

  function roundUpToGridPx(px: number) {
    return Math.ceil(px / GRID_PX) * GRID_PX;
  }

  function autoFitHeights() {
    setSections((prev) =>
      prev.map((s) => {
        const node = sectionNodes.current[s.id];
        if (!node) return s;

        const layout = normalizeLayout((s as { layout?: unknown }).layout);
        const measured = node.scrollHeight;
        const nextH = clamp(roundUpToGridPx(measured), 240, 5000);

        return {
          ...s,
          layout: {
            ...layout,
            h: nextH,
          },
        };
      })
    );

    toast.success("Heights updated", "Section heights were auto-fitted.");
  }

  function applyDefaultGap() {
    setSections((prev) => {
      const sorted = prev.slice().sort((a, b) => a.position - b.position);
      let y = 0;

      const next = sorted.map((s) => {
        const layout = normalizeLayout((s as { layout?: unknown }).layout);
        const h = typeof layout.h === "number" ? layout.h : 0;

        const nextSection: Section = {
          ...s,
          layout: {
            ...layout,
            x: Math.max(0, layout.x),
            y,
          },
        };

        y += h + DEFAULT_SECTION_GAP_PX;
        return nextSection;
      });

      return normalizePositions(next);
    });

    toast.success("Spacing applied", "Added default gap between sections.");
  }

  const canvasMinHeight = useMemo(() => {
    const maxBottom = ordered.reduce((max, s) => {
      const layout = normalizeLayout((s as { layout?: unknown }).layout);
      return Math.max(max, layout.y + estimatedCardHeight(layout));
    }, 0);
    return Math.max(720, maxBottom + 160);
  }, [ordered]);

  async function save() {
    setSaving(true);
    setError(null);

    const parsed = sectionsSchema.safeParse(sections);
    if (!parsed.success) {
      setSaving(false);
      setError("Some sections are invalid. Please review your edits.");
      toast.error("Could not save", "Some sections are invalid.");
      return;
    }

    const res = await fetch("/api/portfolio/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: {
          background: {
            mode: "solid",
            color: pageBackground,
          },
        },
        sections: normalizePositions(parsed.data),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Failed to save. Please try again.");
      toast.error("Save failed", "Please try again.");
      return;
    }

    toast.success("Saved", "Your changes are updated.");
    router.refresh();
  }

  return (
    <div className="relative" style={{ backgroundColor: pageBackground }}>
      <div className="pb-28">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <DndContext
          sensors={sensors}
          onDragEnd={(event) => {
            const { active, delta } = event;
            setSections((prev) =>
              prev.map((s) => {
                if (s.id !== active.id) return s;
                const layout = normalizeLayout(
                  (s as { layout?: unknown }).layout
                );
                return {
                  ...s,
                  layout: {
                    ...layout,
                    x: Math.max(0, layout.x + delta.x),
                    y: Math.max(0, layout.y + delta.y),
                  },
                };
              })
            );
          }}
        >
          <div className="w-full">
            <div
              className="relative"
              style={{
                minHeight: canvasMinHeight,
                backgroundImage:
                  "linear-gradient(to right, rgba(228,228,231,0.8) 1px, transparent 1px), linear-gradient(to bottom, rgba(228,228,231,0.8) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
                backgroundPosition: "0 0",
              }}
            >
              {ordered.map((section) => {
                const onChange = (next: Section) =>
                  setSections((prev) =>
                    normalizePositions(
                      prev.map((p) => (p.id === next.id ? next : p))
                    )
                  );
                const onDelete = () =>
                  setSections((prev) =>
                    normalizePositions(prev.filter((p) => p.id !== section.id))
                  );

                if (section.type === "hero") {
                  return (
                    <SortableHeroHeader
                      key={section.id}
                      section={section}
                      username={username}
                      onChange={onChange}
                      onDelete={onDelete}
                      registerSectionNode={registerSectionNode}
                    />
                  );
                }

                return (
                  <SortablePreviewSection
                    key={section.id}
                    section={section}
                    username={username}
                    onChange={onChange}
                    onDelete={onDelete}
                    registerSectionNode={registerSectionNode}
                  />
                );
              })}
            </div>
          </div>
        </DndContext>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-40">
        <div className="mx-auto w-full max-w-none px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <LinkButton href="/dashboard">Back</LinkButton>
              <p className="hidden sm:block text-sm text-zinc-600">
                Editor mode
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
                <span className="text-xs font-medium text-zinc-700">
                  Background
                </span>
                <input
                  type="color"
                  value={pageBackground}
                  onChange={(e) => setPageBackground(e.target.value)}
                  aria-label="Page background color"
                  className="h-6 w-8 rounded-md border border-zinc-200 bg-white p-0"
                />
              </div>

              <ButtonSecondary onClick={autoFitHeights}>
                Auto-fit heights
              </ButtonSecondary>

              <ButtonSecondary onClick={applyDefaultGap}>
                Apply gap
              </ButtonSecondary>

              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as Section["type"])}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400"
              >
                <option value="hero">Hero</option>
                <option value="about">About</option>
                <option value="skills">Skills</option>
                <option value="projects">Projects</option>
                <option value="contact">Contact</option>
                <option value="custom">Custom</option>
              </select>

              <ButtonSecondary
                onClick={() => {
                  const next = normalizePositions([
                    ...sections,
                    newSection(newType, sections.length),
                  ]);
                  setSections(next);
                  toast.info("Section added");
                }}
              >
                Add section
              </ButtonSecondary>

              <Button onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
