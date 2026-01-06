import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  usernameSchema,
  portfolioDataSchema,
  sectionsSchema,
} from "@/lib/validation";
import { PortfolioView } from "@/components/PortfolioView";
import { getBaseUrl } from "@/lib/site";

function buildProfileJsonLd(opts: {
  username: string;
  name: string;
  headline: string;
  links: Array<{ label: string; href: string }>;
  skills: string[];
  projects: Array<{ name: string; description: string; href: string }>;
}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/${opts.username}`;

  const sameAs = opts.links
    .map((l) => l.href)
    .filter((href) => /^https?:\/\//i.test(href));

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: opts.name,
    url,
    description: opts.headline || undefined,
    mainEntityOfPage: url,
    identifier: opts.username,
    sameAs: sameAs.length ? sameAs : undefined,
    knowsAbout: opts.skills.length ? opts.skills : undefined,
  };

  if (opts.projects.length) {
    jsonLd.hasPart = {
      "@type": "ItemList",
      name: "Projects",
      itemListElement: opts.projects.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "CreativeWork",
          name: p.name,
          description: p.description || undefined,
          url: p.href || undefined,
        },
      })),
    };
  }

  return jsonLd;
}

export const runtime = "nodejs";

export async function generateMetadata(props: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username: raw } = await props.params;
  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) return { title: "Portfolio" };

  const username = parsed.data;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      portfolio: { select: { isPublished: true, sections: true } },
    },
  });

  if (!user?.portfolio?.isPublished) return { title: "Portfolio" };

  const portfolio = portfolioDataSchema.safeParse(user.portfolio.sections);
  const legacySections = sectionsSchema.safeParse(user.portfolio.sections);

  const sections = portfolio.success
    ? portfolio.data.sections
    : legacySections.success
    ? legacySections.data
    : null;

  const hero = sections ? sections.find((s) => s.type === "hero") : null;

  const name = hero ? String(hero.content.name ?? username) : username;
  const headline = hero ? String(hero.content.headline ?? "") : "";
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/${username}`;
  const title = `${name} — Portfolio`;
  const description = headline || `Portfolio of ${name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "Portfolio Builder",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicPortfolioPage(props: {
  params: Promise<{ username: string }>;
}) {
  const { username: raw } = await props.params;
  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) notFound();

  const username = parsed.data;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      portfolio: { select: { isPublished: true, sections: true } },
    },
  });

  if (!user?.portfolio?.isPublished) notFound();

  const portfolio = portfolioDataSchema.safeParse(user.portfolio.sections);
  const legacySections = sectionsSchema.safeParse(user.portfolio.sections);

  const sections = portfolio.success
    ? portfolio.data.sections
    : legacySections.success
    ? legacySections.data
    : null;

  if (!sections) notFound();

  const sorted = [...sections].sort((a, b) => a.position - b.position);
  const hero = sorted.find((s) => s.type === "hero");
  const skills = sorted.find((s) => s.type === "skills");
  const projects = sorted.find((s) => s.type === "projects");

  const name = hero
    ? String(hero.content.name ?? user.username)
    : user.username;
  const headline = hero ? String(hero.content.headline ?? "") : "";

  const links =
    hero && Array.isArray(hero.content.links)
      ? (
          hero.content.links as Array<{
            label?: unknown;
            href?: unknown;
          }>
        ).map((l) => ({
          label: String(l?.label ?? "Link"),
          href: String(l?.href ?? "#"),
        }))
      : [];

  const skillItems =
    skills && Array.isArray(skills.content.items)
      ? (skills.content.items as unknown[])
          .map((x) => String(x))
          .filter(Boolean)
      : [];

  const projectItems =
    projects && Array.isArray(projects.content.items)
      ? (
          projects.content.items as Array<{
            name?: unknown;
            description?: unknown;
            href?: unknown;
          }>
        ).map((p) => ({
          name: String(p?.name ?? "Project"),
          description: String(p?.description ?? ""),
          href: String(p?.href ?? ""),
        }))
      : [];

  const jsonLd = buildProfileJsonLd({
    username: user.username,
    name,
    headline,
    links,
    skills: skillItems,
    projects: projectItems,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PortfolioView
        username={user.username}
        sections={sections}
        page={portfolio.success ? portfolio.data.page : undefined}
      />
    </>
  );
}
