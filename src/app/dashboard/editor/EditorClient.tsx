"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
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
      content: { body: "Write a short bio." },
    };
  }

  if (type === "skills") {
    return {
      id: uid(),
      type,
      position,
      content: { items: ["TypeScript", "React"] },
    };
  }

  if (type === "projects") {
    return {
      id: uid(),
      type,
      position,
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
      content: { email: "you@example.com", location: "City, Country" },
    };
  }

  return {
    id: uid(),
    type: "custom",
    position,
    content: { title: "Custom section", body: "" },
  };
}

function normalizePositions(sections: Section[]) {
  return sections
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s, i) => ({ ...s, position: i }));
}

function SortableChrome({
  section,
  dragHandle,
  onDelete,
}: {
  section: Section;
  dragHandle: React.ReactNode;
  onDelete: () => void;
}) {
  return (
    <div className="pointer-events-auto flex items-center gap-2">
      {dragHandle}
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
}: {
  section: Section;
  username: string;
  onChange: (next: Section) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
        ref={setNodeRef}
        style={style}
        className={`relative rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm ${
          isDragging ? "opacity-80" : ""
        }`}
      >
        <div className="absolute right-4 top-4">
          <SortableChrome
            section={section}
            dragHandle={dragHandle}
            onDelete={onDelete}
          />
        </div>

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
              <span
                key={`${section.id}_link_${i}`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950"
              >
                {l.label}
              </span>
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
      </section>
    );
  }

  if (section.type === "about") {
    const body = String(section.content.body ?? "");
    return (
      <section
        ref={setNodeRef}
        style={style}
        className={`relative rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm ${
          isDragging ? "opacity-80" : ""
        }`}
      >
        <div className="absolute right-4 top-4">
          <SortableChrome
            section={section}
            dragHandle={dragHandle}
            onDelete={onDelete}
          />
        </div>

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
        ref={setNodeRef}
        style={style}
        className={`relative rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm ${
          isDragging ? "opacity-80" : ""
        }`}
      >
        <div className="absolute right-4 top-4">
          <SortableChrome
            section={section}
            dragHandle={dragHandle}
            onDelete={onDelete}
          />
        </div>

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
      </section>
    );
  }

  if (section.type === "projects") {
    return (
      <section
        ref={setNodeRef}
        style={style}
        className={`relative rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm ${
          isDragging ? "opacity-80" : ""
        }`}
      >
        <div className="absolute right-4 top-4">
          <SortableChrome
            section={section}
            dragHandle={dragHandle}
            onDelete={onDelete}
          />
        </div>
        <h2 className="text-lg font-semibold text-zinc-950">Projects</h2>
        <div className="mt-4">
          <ProjectsEditor section={section} onChange={onChange} />
        </div>
      </section>
    );
  }

  if (section.type === "contact") {
    const email = String(section.content.email ?? "");
    const location = String(section.content.location ?? "");
    return (
      <section
        ref={setNodeRef}
        style={style}
        className={`relative rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm ${
          isDragging ? "opacity-80" : ""
        }`}
      >
        <div className="absolute right-4 top-4">
          <SortableChrome
            section={section}
            dragHandle={dragHandle}
            onDelete={onDelete}
          />
        </div>

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
      </section>
    );
  }

  // custom
  const title = String(section.content.title ?? "");
  const body = String(section.content.body ?? "");
  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`relative rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm ${
        isDragging ? "opacity-80" : ""
      }`}
    >
      <div className="absolute right-4 top-4">
        <SortableChrome
          section={section}
          dragHandle={dragHandle}
          onDelete={onDelete}
        />
      </div>
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
    </section>
  );
}

function SortableHeroHeader({
  section,
  username,
  onChange,
  onDelete,
}: {
  section: Section;
  username: string;
  onChange: (next: Section) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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

  return (
    <header
      ref={setNodeRef}
      style={style}
      className={`relative rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm ${
        isDragging ? "opacity-80" : ""
      }`}
    >
      <div className="absolute right-4 top-4">
        <SortableChrome
          section={section}
          dragHandle={dragHandle}
          onDelete={onDelete}
        />
      </div>

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
                <span
                  key={`${section.id}_link_${i}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950"
                >
                  {l.label}
                </span>
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
}: {
  username: string;
  initialSections: Sections;
}) {
  const router = useRouter();
  const toast = useToast();

  const [sections, setSections] = useState<Section[]>(() =>
    normalizePositions(initialSections)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newType, setNewType] = useState<Section["type"]>("custom");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const ids = useMemo(() => sections.map((s) => s.id), [sections]);
  const ordered = useMemo(
    () => sections.slice().sort((a, b) => a.position - b.position),
    [sections]
  );
  const heroFirst = ordered.length > 0 && ordered[0]?.type === "hero";

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
      body: JSON.stringify({ sections: normalizePositions(parsed.data) }),
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
    <div className="relative">
      <div className="pb-28">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event;
            if (!over) return;
            if (active.id === over.id) return;

            const oldIndex = sections.findIndex((s) => s.id === active.id);
            const newIndex = sections.findIndex((s) => s.id === over.id);
            const moved = arrayMove(sections, oldIndex, newIndex);
            setSections(normalizePositions(moved));
          }}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="grid gap-8">
              {ordered.map((section, index) => {
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

                if (heroFirst && index === 0) {
                  return (
                    <SortableHeroHeader
                      key={section.id}
                      section={section}
                      username={username}
                      onChange={onChange}
                      onDelete={onDelete}
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
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-40">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <LinkButton href="/dashboard">Back</LinkButton>
              <p className="hidden sm:block text-sm text-zinc-600">
                Editor mode
              </p>
            </div>

            <div className="flex items-center gap-2">
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
