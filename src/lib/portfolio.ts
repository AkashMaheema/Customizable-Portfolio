import { sectionsSchema } from "./validation";

function uid() {
  // Good-enough for client-only IDs; persisted in DB.
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultSections() {
  const sections = [
    {
      id: uid(),
      type: "hero" as const,
      position: 0,
      content: {
        name: "Your Name",
        headline: "What you do, in one sentence.",
        links: [{ label: "Email", href: "mailto:you@example.com" }],
      },
    },
    {
      id: uid(),
      type: "about" as const,
      position: 1,
      content: {
        body: "Write a short bio. Keep it concise and specific.",
      },
    },
    {
      id: uid(),
      type: "skills" as const,
      position: 2,
      content: {
        items: ["TypeScript", "React", "PostgreSQL"],
      },
    },
    {
      id: uid(),
      type: "projects" as const,
      position: 3,
      content: {
        items: [
          {
            name: "Project name",
            description: "One or two lines describing it.",
            href: "https://example.com",
          },
        ],
      },
    },
    {
      id: uid(),
      type: "contact" as const,
      position: 4,
      content: {
        email: "you@example.com",
        location: "City, Country",
      },
    },
  ];

  return sectionsSchema.parse(sections);
}

export function normalizePositions(sections: unknown) {
  const parsed = sectionsSchema.parse(sections);
  const sorted = [...parsed].sort((a, b) => a.position - b.position);
  return sorted.map((s, i) => ({ ...s, position: i }));
}
