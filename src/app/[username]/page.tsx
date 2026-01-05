import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { usernameSchema, sectionsSchema } from "@/lib/validation";
import { PortfolioView } from "@/components/PortfolioView";

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

  const sections = sectionsSchema.safeParse(user.portfolio.sections);
  const hero = sections.success
    ? sections.data.find((s) => s.type === "hero")
    : null;

  const name = hero ? String(hero.content.name ?? username) : username;
  const headline = hero ? String(hero.content.headline ?? "") : "";

  return {
    title: `${name} — Portfolio`,
    description: headline || `Portfolio of ${name}.`,
    openGraph: {
      title: `${name} — Portfolio`,
      description: headline || `Portfolio of ${name}.`,
      type: "website",
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

  const sections = sectionsSchema.safeParse(user.portfolio.sections);
  if (!sections.success) notFound();

  return <PortfolioView username={user.username} sections={sections.data} />;
}
