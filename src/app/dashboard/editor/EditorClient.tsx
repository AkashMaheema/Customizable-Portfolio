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

function SortableCard({
  section,
  onChange,
  onDelete,
}: {
  section: Section;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${
        isDragging ? "opacity-80" : ""
      }
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-50 active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label="Drag handle"
          >
            Drag
          </button>
          <p className="text-sm font-semibold text-zinc-950">
            {section.type.toUpperCase()}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Delete
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {section.type === "hero" ? (
          <>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-zinc-700">Name</span>
              <input
                className="h-10 rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
                value={String(section.content.name ?? "")}
                onChange={(e) =>
                  onChange({
                    ...section,
                    content: { ...section.content, name: e.target.value },
                  })
                }
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-zinc-700">
                Headline
              </span>
              <textarea
                className="min-h-24 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
                value={String(section.content.headline ?? "")}
                onChange={(e) =>
                  onChange({
                    ...section,
                    content: { ...section.content, headline: e.target.value },
                  })
                }
              />
            </label>
          </>
        ) : null}

        {section.type === "about" ? (
          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-700">Bio</span>
            <textarea
              className="min-h-28 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
              value={String(section.content.body ?? "")}
              onChange={(e) =>
                onChange({
                  ...section,
                  content: { ...section.content, body: e.target.value },
                })
              }
            />
          </label>
        ) : null}

        {section.type === "skills" ? (
          <label className="grid gap-1">
            <span className="text-xs font-medium text-zinc-700">
              Skills (comma separated)
            </span>
            <input
              className="h-10 rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
              value={
                Array.isArray(section.content.items)
                  ? (section.content.items as unknown[])
                      .map((x) => String(x))
                      .join(", ")
                  : ""
              }
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
            />
          </label>
        ) : null}

        {section.type === "projects" ? (
          <ProjectsEditor section={section} onChange={onChange} />
        ) : null}

        {section.type === "contact" ? (
          <>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-zinc-700">Email</span>
              <input
                className="h-10 rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
                value={String(section.content.email ?? "")}
                onChange={(e) =>
                  onChange({
                    ...section,
                    content: { ...section.content, email: e.target.value },
                  })
                }
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-zinc-700">
                Location
              </span>
              <input
                className="h-10 rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
                value={String(section.content.location ?? "")}
                onChange={(e) =>
                  onChange({
                    ...section,
                    content: { ...section.content, location: e.target.value },
                  })
                }
              />
            </label>
          </>
        ) : null}

        {section.type === "custom" ? (
          <>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-zinc-700">Title</span>
              <input
                className="h-10 rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
                value={String(section.content.title ?? "")}
                onChange={(e) =>
                  onChange({
                    ...section,
                    content: { ...section.content, title: e.target.value },
                  })
                }
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-zinc-700">Body</span>
              <textarea
                className="min-h-28 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
                value={String(section.content.body ?? "")}
                onChange={(e) =>
                  onChange({
                    ...section,
                    content: { ...section.content, body: e.target.value },
                  })
                }
              />
            </label>
          </>
        ) : null}
      </div>
    </div>
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
        <p className="text-xs font-medium text-zinc-700">Projects</p>
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
            className="rounded-xl border border-zinc-200 bg-white p-4"
          >
            <div className="grid gap-2">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-zinc-700">Name</span>
                <input
                  className="h-10 rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
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
                  className="h-10 rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
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
                  className="h-10 rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
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
  initialSections,
}: {
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
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LinkButton href="/dashboard">Back</LinkButton>
          <p className="text-sm text-zinc-600">
            Drag sections to reorder. Save when done.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ButtonSecondary
            onClick={() => {
              const next = normalizePositions([
                ...sections,
                newSection(newType, sections.length),
              ]);
              setSections(next);
            }}
          >
            Add section
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

          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
          <div className="grid gap-4">
            {sections
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((section) => (
                <SortableCard
                  key={section.id}
                  section={section}
                  onChange={(next) =>
                    setSections((prev) =>
                      normalizePositions(
                        prev.map((p) => (p.id === next.id ? next : p))
                      )
                    )
                  }
                  onDelete={() =>
                    setSections((prev) =>
                      normalizePositions(
                        prev.filter((p) => p.id !== section.id)
                      )
                    )
                  }
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
